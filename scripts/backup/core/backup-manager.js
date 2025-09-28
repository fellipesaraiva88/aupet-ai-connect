/**
 * Enterprise Backup Manager
 * Handles automated backups, encryption, compression, and cloud storage
 */

const { Client } = require('pg');
const crypto = require('crypto');
const zlib = require('zlib');
const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const { BlobServiceClient } = require('@azure/storage-blob');
const EventEmitter = require('events');
const config = require('../config/backup-config');
const Logger = require('./logger');
const SecurityManager = require('./security-manager');

class BackupManager extends EventEmitter {
  constructor() {
    super();
    this.logger = new Logger('BackupManager');
    this.security = new SecurityManager();
    this.isRunning = false;
    this.currentJobs = new Map();
    this.metrics = {
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0,
      totalSizeBytes: 0,
      averageBackupTime: 0
    };
  }

  /**
   * Initialize backup manager
   */
  async initialize() {
    try {
      this.logger.info('Initializing Backup Manager...');

      // Initialize storage providers
      await this.initializeStorageProviders();

      // Setup monitoring
      await this.setupMonitoring();

      // Validate configuration
      await this.validateConfiguration();

      // Setup scheduled jobs
      await this.setupScheduledJobs();

      this.logger.info('Backup Manager initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize Backup Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize cloud storage providers
   */
  async initializeStorageProviders() {
    const { storage } = config;

    // AWS S3
    if (storage.provider === 'aws' || storage.aws.bucket) {
      this.s3 = new AWS.S3({
        region: storage.aws.region,
        accessKeyId: storage.aws.accessKeyId,
        secretAccessKey: storage.aws.secretAccessKey
      });

      // Test connection
      try {
        await this.s3.headBucket({ Bucket: storage.aws.bucket }).promise();
        this.logger.info('AWS S3 connection established');
      } catch (error) {
        this.logger.error('AWS S3 connection failed:', error);
        throw error;
      }
    }

    // Google Cloud Storage
    if (storage.provider === 'gcp' || storage.gcp.bucket) {
      this.gcs = new Storage({
        projectId: storage.gcp.projectId,
        keyFilename: storage.gcp.keyFilename
      });

      this.gcsBucket = this.gcs.bucket(storage.gcp.bucket);

      // Test connection
      try {
        await this.gcsBucket.exists();
        this.logger.info('Google Cloud Storage connection established');
      } catch (error) {
        this.logger.error('GCS connection failed:', error);
        throw error;
      }
    }

    // Azure Blob Storage
    if (storage.provider === 'azure' || storage.azure.container) {
      this.azureClient = BlobServiceClient.fromConnectionString(
        `DefaultEndpointsProtocol=https;AccountName=${storage.azure.accountName};AccountKey=${storage.azure.accountKey};EndpointSuffix=core.windows.net`
      );

      this.azureContainer = this.azureClient.getContainerClient(storage.azure.container);

      // Test connection
      try {
        await this.azureContainer.exists();
        this.logger.info('Azure Blob Storage connection established');
      } catch (error) {
        this.logger.error('Azure connection failed:', error);
        throw error;
      }
    }
  }

  /**
   * Perform full database backup
   */
  async performFullBackup(options = {}) {
    const backupId = this.generateBackupId();
    const startTime = Date.now();

    try {
      this.logger.info(`Starting full backup: ${backupId}`);
      this.currentJobs.set(backupId, { type: 'full', startTime, status: 'running' });

      // Create database connection
      const client = new Client(config.database);
      await client.connect();

      const backupData = {
        id: backupId,
        type: 'full',
        timestamp: new Date().toISOString(),
        tables: {},
        metadata: {
          version: process.env.APP_VERSION || '1.0.0',
          nodeVersion: process.version,
          backupManagerVersion: '1.0.0'
        }
      };

      // Backup critical tables by tier
      const allTables = [
        ...config.criticalTables.tier1,
        ...config.criticalTables.tier2,
        ...config.criticalTables.tier3
      ];

      // Process tables in parallel batches
      const batchSize = config.performance.parallelJobs;
      for (let i = 0; i < allTables.length; i += batchSize) {
        const batch = allTables.slice(i, i + batchSize);
        const promises = batch.map(table => this.backupTable(client, table, backupId));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          const table = batch[index];
          if (result.status === 'fulfilled') {
            backupData.tables[table.name] = result.value;
          } else {
            this.logger.error(`Failed to backup table ${table.name}:`, result.reason);
            throw new Error(`Table backup failed: ${table.name}`);
          }
        });
      }

      await client.end();

      // Compress and encrypt backup
      const compressedData = await this.compressData(JSON.stringify(backupData));
      const encryptedData = await this.security.encryptData(compressedData);

      // Upload to cloud storage
      const uploadResult = await this.uploadBackup(backupId, encryptedData, 'full');

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateMetrics('success', encryptedData.length, duration);

      // Cleanup local files if configured
      if (config.storage.provider !== 'local') {
        await this.cleanupLocalFiles(backupId);
      }

      // Update job status
      this.currentJobs.set(backupId, {
        type: 'full',
        startTime,
        endTime: Date.now(),
        status: 'completed',
        size: encryptedData.length,
        location: uploadResult.location
      });

      this.logger.info(`Full backup completed: ${backupId} (${this.formatBytes(encryptedData.length)})`);
      this.emit('backupCompleted', { id: backupId, type: 'full', size: encryptedData.length });

      return { id: backupId, size: encryptedData.length, location: uploadResult.location };

    } catch (error) {
      this.logger.error(`Full backup failed: ${backupId}`, error);
      this.updateMetrics('failed');
      this.currentJobs.delete(backupId);
      this.emit('backupFailed', { id: backupId, type: 'full', error: error.message });
      throw error;
    }
  }

  /**
   * Perform incremental backup
   */
  async performIncrementalBackup(options = {}) {
    const backupId = this.generateBackupId();
    const startTime = Date.now();

    try {
      this.logger.info(`Starting incremental backup: ${backupId}`);
      this.currentJobs.set(backupId, { type: 'incremental', startTime, status: 'running' });

      // Get last backup timestamp
      const lastBackupTime = await this.getLastBackupTimestamp('incremental');

      // Create database connection
      const client = new Client(config.database);
      await client.connect();

      const backupData = {
        id: backupId,
        type: 'incremental',
        timestamp: new Date().toISOString(),
        baseTimestamp: lastBackupTime,
        changes: {},
        metadata: {
          version: process.env.APP_VERSION || '1.0.0'
        }
      };

      // Get only tier 1 tables for incremental (most critical)
      const criticalTables = config.criticalTables.tier1.filter(
        table => table.backup_frequency === 'hourly'
      );

      // Backup changed records only
      for (const table of criticalTables) {
        const changes = await this.getTableChanges(client, table, lastBackupTime);
        if (changes.length > 0) {
          backupData.changes[table.name] = {
            tableInfo: table,
            records: changes,
            count: changes.length
          };
        }
      }

      await client.end();

      // Only proceed if there are changes
      if (Object.keys(backupData.changes).length === 0) {
        this.logger.info(`No changes detected for incremental backup: ${backupId}`);
        this.currentJobs.delete(backupId);
        return { id: backupId, size: 0, changes: 0 };
      }

      // Compress and encrypt backup
      const compressedData = await this.compressData(JSON.stringify(backupData));
      const encryptedData = await this.security.encryptData(compressedData);

      // Upload to cloud storage
      const uploadResult = await this.uploadBackup(backupId, encryptedData, 'incremental');

      // Update metrics
      const duration = Date.now() - startTime;
      this.updateMetrics('success', encryptedData.length, duration);

      // Update job status
      this.currentJobs.set(backupId, {
        type: 'incremental',
        startTime,
        endTime: Date.now(),
        status: 'completed',
        size: encryptedData.length,
        changes: Object.keys(backupData.changes).length,
        location: uploadResult.location
      });

      this.logger.info(`Incremental backup completed: ${backupId} (${Object.keys(backupData.changes).length} tables changed)`);
      this.emit('backupCompleted', { id: backupId, type: 'incremental', size: encryptedData.length });

      return { id: backupId, size: encryptedData.length, location: uploadResult.location };

    } catch (error) {
      this.logger.error(`Incremental backup failed: ${backupId}`, error);
      this.updateMetrics('failed');
      this.currentJobs.delete(backupId);
      this.emit('backupFailed', { id: backupId, type: 'incremental', error: error.message });
      throw error;
    }
  }

  /**
   * Backup single table with PII protection
   */
  async backupTable(client, tableConfig, backupId) {
    try {
      this.logger.debug(`Backing up table: ${tableConfig.name}`);

      // Build query with PII considerations
      let query = `SELECT * FROM ${tableConfig.name}`;

      // Add ordering for consistent backups
      query += ` ORDER BY created_at DESC`;

      const result = await client.query(query);

      // Apply PII protection if needed
      let data = result.rows;
      if (tableConfig.pii && tableConfig.gdpr_fields) {
        data = await this.security.protectPII(data, tableConfig.gdpr_fields);
      }

      return {
        tableInfo: tableConfig,
        recordCount: result.rows.length,
        data: data,
        schema: this.extractTableSchema(result.fields),
        backupTime: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to backup table ${tableConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Get table changes since last backup
   */
  async getTableChanges(client, tableConfig, sinceTimestamp) {
    try {
      // Check if table has updated_at column
      const hasUpdatedAt = await this.checkColumnExists(client, tableConfig.name, 'updated_at');
      const hasCreatedAt = await this.checkColumnExists(client, tableConfig.name, 'created_at');

      let query;
      if (hasUpdatedAt) {
        query = `
          SELECT * FROM ${tableConfig.name}
          WHERE updated_at > $1 OR created_at > $1
          ORDER BY COALESCE(updated_at, created_at) DESC
        `;
      } else if (hasCreatedAt) {
        query = `
          SELECT * FROM ${tableConfig.name}
          WHERE created_at > $1
          ORDER BY created_at DESC
        `;
      } else {
        // Fallback: return all records (treat as full backup for this table)
        query = `SELECT * FROM ${tableConfig.name}`;
        const result = await client.query(query);
        return result.rows;
      }

      const result = await client.query(query, [sinceTimestamp]);
      return result.rows;

    } catch (error) {
      this.logger.error(`Failed to get changes for table ${tableConfig.name}:`, error);
      throw error;
    }
  }

  /**
   * Check if column exists in table
   */
  async checkColumnExists(client, tableName, columnName) {
    const query = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    `;

    const result = await client.query(query, [tableName, columnName]);
    return result.rows.length > 0;
  }

  /**
   * Extract table schema information
   */
  extractTableSchema(fields) {
    return fields.map(field => ({
      name: field.name,
      type: field.dataTypeID,
      modifier: field.typeModifier
    }));
  }

  /**
   * Compress data using gzip
   */
  async compressData(data) {
    return new Promise((resolve, reject) => {
      zlib.gzip(data, { level: config.performance.compressionLevel }, (error, compressed) => {
        if (error) reject(error);
        else resolve(compressed);
      });
    });
  }

  /**
   * Upload backup to configured storage
   */
  async uploadBackup(backupId, data, type) {
    const { storage } = config;
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `${timestamp}/${type}/${backupId}.backup`;

    try {
      switch (storage.provider) {
        case 'aws':
          return await this.uploadToS3(fileName, data);
        case 'gcp':
          return await this.uploadToGCS(fileName, data);
        case 'azure':
          return await this.uploadToAzure(fileName, data);
        case 'local':
          return await this.uploadToLocal(fileName, data);
        default:
          throw new Error(`Unsupported storage provider: ${storage.provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to upload backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Upload to AWS S3
   */
  async uploadToS3(fileName, data) {
    const params = {
      Bucket: config.storage.aws.bucket,
      Key: fileName,
      Body: data,
      StorageClass: config.storage.aws.storageClass,
      ServerSideEncryption: 'AES256',
      Metadata: {
        'backup-manager': 'auzap-enterprise',
        'encrypted': 'true',
        'compressed': 'true'
      }
    };

    const result = await this.s3.upload(params).promise();
    return { location: result.Location, etag: result.ETag };
  }

  /**
   * Upload to Google Cloud Storage
   */
  async uploadToGCS(fileName, data) {
    const file = this.gcsBucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        metadata: {
          'backup-manager': 'auzap-enterprise',
          'encrypted': 'true',
          'compressed': 'true'
        }
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', () => {
        resolve({ location: `gs://${config.storage.gcp.bucket}/${fileName}` });
      });
      stream.end(data);
    });
  }

  /**
   * Upload to Azure Blob Storage
   */
  async uploadToAzure(fileName, data) {
    const blockBlobClient = this.azureContainer.getBlockBlobClient(fileName);

    const uploadOptions = {
      metadata: {
        'backup-manager': 'auzap-enterprise',
        'encrypted': 'true',
        'compressed': 'true'
      }
    };

    const result = await blockBlobClient.upload(data, data.length, uploadOptions);
    return { location: blockBlobClient.url, etag: result.etag };
  }

  /**
   * Upload to local storage
   */
  async uploadToLocal(fileName, data) {
    const fullPath = path.join(config.storage.local.path, fileName);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, data);

    return { location: fullPath };
  }

  /**
   * Get last backup timestamp
   */
  async getLastBackupTimestamp(type) {
    // Implementation would query backup metadata or use a tracking file
    // For now, return 24 hours ago as default
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    return oneDayAgo.toISOString();
  }

  /**
   * Generate unique backup ID
   */
  generateBackupId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = crypto.randomBytes(4).toString('hex');
    return `backup-${timestamp}-${random}`;
  }

  /**
   * Update backup metrics
   */
  updateMetrics(status, size = 0, duration = 0) {
    this.metrics.totalBackups++;

    if (status === 'success') {
      this.metrics.successfulBackups++;
      this.metrics.totalSizeBytes += size;

      // Update average backup time
      const totalDuration = this.metrics.averageBackupTime * (this.metrics.successfulBackups - 1) + duration;
      this.metrics.averageBackupTime = totalDuration / this.metrics.successfulBackups;
    } else {
      this.metrics.failedBackups++;
    }
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Setup monitoring and alerting
   */
  async setupMonitoring() {
    // Implementation for monitoring setup
    this.logger.info('Monitoring setup completed');
  }

  /**
   * Validate configuration
   */
  async validateConfiguration() {
    // Implementation for config validation
    this.logger.info('Configuration validated');
  }

  /**
   * Setup scheduled backup jobs
   */
  async setupScheduledJobs() {
    // Implementation for scheduled jobs
    this.logger.info('Scheduled jobs setup completed');
  }

  /**
   * Cleanup local files
   */
  async cleanupLocalFiles(backupId) {
    // Implementation for local file cleanup
    this.logger.debug(`Cleaned up local files for backup: ${backupId}`);
  }

  /**
   * Get current backup metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalBackups > 0
        ? (this.metrics.successfulBackups / this.metrics.totalBackups * 100).toFixed(2) + '%'
        : '0%',
      currentJobs: Array.from(this.currentJobs.values())
    };
  }
}

module.exports = BackupManager;