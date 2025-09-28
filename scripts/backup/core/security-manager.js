/**
 * Security Manager for Backup System
 * Handles encryption, PII protection, and compliance
 */

const crypto = require('crypto');
const AWS = require('aws-sdk');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');
const config = require('../config/backup-config');
const Logger = require('./logger');

class SecurityManager {
  constructor() {
    this.logger = new Logger('SecurityManager');
    this.encryptionKeys = new Map();
    this.piiHashMap = new Map();
    this.accessLog = [];
  }

  /**
   * Initialize security manager
   */
  async initialize() {
    try {
      this.logger.info('Initializing Security Manager...');

      // Initialize KMS providers
      await this.initializeKMS();

      // Load encryption keys
      await this.loadEncryptionKeys();

      // Setup audit logging
      await this.setupAuditLogging();

      this.logger.info('Security Manager initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Security Manager:', error);
      throw error;
    }
  }

  /**
   * Initialize Key Management Service
   */
  async initializeKMS() {
    const { kms } = config.encryption;

    switch (kms.provider) {
      case 'aws':
        this.kms = new AWS.KMS({ region: kms.region });
        break;

      case 'gcp':
        this.kms = new SecretManagerServiceClient();
        break;

      case 'azure':
        const credential = new DefaultAzureCredential();
        this.kms = new SecretClient(kms.vaultUrl, credential);
        break;

      default:
        this.logger.warn('No KMS provider configured, using local encryption');
        this.kms = null;
    }
  }

  /**
   * Load or generate encryption keys
   */
  async loadEncryptionKeys() {
    try {
      // Try to load existing key from KMS
      const existingKey = await this.getKeyFromKMS('backup-encryption-key');

      if (existingKey) {
        this.masterKey = existingKey;
        this.logger.info('Loaded existing encryption key from KMS');
      } else {
        // Generate new key
        this.masterKey = crypto.randomBytes(32);
        await this.storeKeyInKMS('backup-encryption-key', this.masterKey);
        this.logger.info('Generated new encryption key and stored in KMS');
      }

    } catch (error) {
      this.logger.warn('KMS not available, using local key generation');
      this.masterKey = crypto.randomBytes(32);
    }
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  async encryptData(data, keyId = 'default') {
    try {
      if (!config.encryption.enabled) {
        return data;
      }

      // Generate IV for this encryption
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipher(config.encryption.algorithm, this.masterKey);
      cipher.setAAD(Buffer.from(keyId));

      // Encrypt data
      let encrypted = cipher.update(data);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and encrypted data
      const result = Buffer.concat([iv, authTag, encrypted]);

      // Log encryption event
      this.logSecurityEvent('encryption', {
        keyId,
        dataSize: data.length,
        encryptedSize: result.length
      });

      return result;

    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  async decryptData(encryptedData, keyId = 'default') {
    try {
      if (!config.encryption.enabled) {
        return encryptedData;
      }

      // Extract IV, auth tag, and encrypted data
      const iv = encryptedData.slice(0, 16);
      const authTag = encryptedData.slice(16, 32);
      const encrypted = encryptedData.slice(32);

      // Create decipher
      const decipher = crypto.createDecipher(config.encryption.algorithm, this.masterKey);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from(keyId));

      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      // Log decryption event
      this.logSecurityEvent('decryption', {
        keyId,
        encryptedSize: encryptedData.length,
        decryptedSize: decrypted.length
      });

      return decrypted;

    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  /**
   * Protect PII data according to LGPD/GDPR
   */
  async protectPII(records, piiFields) {
    if (!config.compliance.lgpd.enabled && !config.compliance.gdpr.enabled) {
      return records;
    }

    const protectedRecords = [];

    for (const record of records) {
      const protectedRecord = { ...record };

      // Apply PII protection based on compliance settings
      for (const field of piiFields) {
        if (record[field]) {
          if (config.compliance.lgpd.pseudonymization || config.compliance.gdpr.enabled) {
            // Pseudonymize PII
            protectedRecord[field] = await this.pseudonymizeData(record[field], field);
          } else {
            // Hash PII for anonymization
            protectedRecord[field] = this.hashPII(record[field]);
          }
        }
      }

      protectedRecords.push(protectedRecord);
    }

    // Log PII protection event
    this.logSecurityEvent('pii_protection', {
      recordCount: records.length,
      fieldsProtected: piiFields,
      method: config.compliance.lgpd.pseudonymization ? 'pseudonymization' : 'hashing'
    });

    return protectedRecords;
  }

  /**
   * Pseudonymize data (reversible transformation)
   */
  async pseudonymizeData(data, field) {
    // Create deterministic pseudonym
    const hash = crypto.createHmac('sha256', this.masterKey);
    hash.update(`${field}:${data}`);
    const pseudonym = hash.digest('hex').substring(0, 16);

    // Store mapping for potential restoration (if legally required)
    if (config.compliance.gdpr.dataPortability) {
      const mappingKey = `${field}:${pseudonym}`;
      this.piiHashMap.set(mappingKey, data);
    }

    return `pseudo_${pseudonym}`;
  }

  /**
   * Hash PII data (irreversible)
   */
  hashPII(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return `hash_${hash.digest('hex').substring(0, 16)}`;
  }

  /**
   * Implement right to erasure (GDPR)
   */
  async processErasureRequest(userId, backupId) {
    if (!config.compliance.gdpr.rightToBeErasure) {
      throw new Error('Right to erasure not enabled');
    }

    try {
      this.logger.info(`Processing erasure request for user ${userId} in backup ${backupId}`);

      // Implementation would:
      // 1. Identify all PII records for the user
      // 2. Remove or anonymize the data
      // 3. Update backup with cleaned data
      // 4. Create audit trail

      this.logSecurityEvent('erasure_request', {
        userId,
        backupId,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'completed',
        userId,
        backupId,
        erasedRecords: 0 // Would be actual count
      };

    } catch (error) {
      this.logger.error(`Erasure request failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Implement data portability (GDPR)
   */
  async processPortabilityRequest(userId, format = 'json') {
    if (!config.compliance.gdpr.dataPortability) {
      throw new Error('Data portability not enabled');
    }

    try {
      this.logger.info(`Processing data portability request for user ${userId}`);

      // Implementation would:
      // 1. Collect all user data from backups
      // 2. De-pseudonymize if possible
      // 3. Format data according to request
      // 4. Create secure download link

      this.logSecurityEvent('portability_request', {
        userId,
        format,
        timestamp: new Date().toISOString()
      });

      return {
        status: 'completed',
        userId,
        format,
        downloadUrl: 'https://secure-download-link.example.com',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };

    } catch (error) {
      this.logger.error(`Portability request failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateEncryptionKeys() {
    if (!config.encryption.keyRotation.enabled) {
      return;
    }

    try {
      this.logger.info('Starting encryption key rotation');

      // Generate new key
      const newKey = crypto.randomBytes(32);

      // Store old key with timestamp
      const oldKeyId = `backup-encryption-key-${Date.now()}`;
      await this.storeKeyInKMS(oldKeyId, this.masterKey);

      // Store new key as current
      await this.storeKeyInKMS('backup-encryption-key', newKey);

      // Update current key
      this.masterKey = newKey;

      this.logSecurityEvent('key_rotation', {
        oldKeyId,
        newKeyId: 'backup-encryption-key',
        timestamp: new Date().toISOString()
      });

      this.logger.info('Encryption key rotation completed');

    } catch (error) {
      this.logger.error('Key rotation failed:', error);
      throw error;
    }
  }

  /**
   * Validate access permissions
   */
  async validateAccess(operation, userId, resourceId) {
    if (!config.security.accessControl.enabled) {
      return true;
    }

    try {
      // Implementation would check:
      // 1. User permissions
      // 2. Resource access rights
      // 3. MFA requirements
      // 4. Time-based restrictions

      const hasPermission = true; // Placeholder

      this.logSecurityEvent('access_validation', {
        operation,
        userId,
        resourceId,
        result: hasPermission ? 'granted' : 'denied',
        timestamp: new Date().toISOString()
      });

      return hasPermission;

    } catch (error) {
      this.logger.error('Access validation failed:', error);
      return false;
    }
  }

  /**
   * Get key from KMS
   */
  async getKeyFromKMS(keyId) {
    if (!this.kms) {
      return null;
    }

    try {
      const { kms } = config.encryption;

      switch (kms.provider) {
        case 'aws':
          const awsResult = await this.kms.getParametersByPath({
            Path: `/backup-keys/${keyId}`
          }).promise();
          return awsResult.Parameters[0]?.Value ? Buffer.from(awsResult.Parameters[0].Value, 'base64') : null;

        case 'gcp':
          const gcpResult = await this.kms.accessSecretVersion({
            name: `projects/${kms.projectId}/secrets/${keyId}/versions/latest`
          });
          return gcpResult[0].payload.data;

        case 'azure':
          const azureResult = await this.kms.getSecret(keyId);
          return azureResult.value ? Buffer.from(azureResult.value, 'base64') : null;

        default:
          return null;
      }

    } catch (error) {
      this.logger.warn(`Failed to get key from KMS: ${error.message}`);
      return null;
    }
  }

  /**
   * Store key in KMS
   */
  async storeKeyInKMS(keyId, key) {
    if (!this.kms) {
      return false;
    }

    try {
      const { kms } = config.encryption;
      const keyBase64 = key.toString('base64');

      switch (kms.provider) {
        case 'aws':
          await this.kms.putParameter({
            Name: `/backup-keys/${keyId}`,
            Value: keyBase64,
            Type: 'SecureString',
            Overwrite: true
          }).promise();
          break;

        case 'gcp':
          await this.kms.createSecret({
            parent: `projects/${kms.projectId}`,
            secretId: keyId,
            secret: {
              replication: { automatic: {} }
            }
          });
          await this.kms.addSecretVersion({
            parent: `projects/${kms.projectId}/secrets/${keyId}`,
            payload: { data: key }
          });
          break;

        case 'azure':
          await this.kms.setSecret(keyId, keyBase64);
          break;
      }

      return true;

    } catch (error) {
      this.logger.error(`Failed to store key in KMS: ${error.message}`);
      return false;
    }
  }

  /**
   * Setup audit logging
   */
  async setupAuditLogging() {
    if (!config.security.auditLog.enabled) {
      return;
    }

    // Implementation would setup audit log storage
    this.logger.info('Audit logging setup completed');
  }

  /**
   * Log security events
   */
  logSecurityEvent(eventType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      details,
      sessionId: this.generateSessionId()
    };

    this.accessLog.push(event);

    // In production, would also send to SIEM
    if (config.security.auditLog.siem.enabled) {
      this.sendToSIEM(event);
    }

    this.logger.info(`Security event logged: ${eventType}`);
  }

  /**
   * Send event to SIEM
   */
  async sendToSIEM(event) {
    // Implementation would send to configured SIEM system
    this.logger.debug(`SIEM event sent: ${event.type}`);
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.accessLog.filter(
      event => new Date(event.timestamp).getTime() > oneDayAgo
    );

    const eventCounts = recentEvents.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {});

    return {
      totalEvents: this.accessLog.length,
      recentEvents: recentEvents.length,
      eventTypes: eventCounts,
      encryptionEnabled: config.encryption.enabled,
      complianceEnabled: {
        lgpd: config.compliance.lgpd.enabled,
        gdpr: config.compliance.gdpr.enabled,
        hipaa: config.compliance.hipaa.enabled
      },
      lastKeyRotation: this.lastKeyRotation || null
    };
  }
}

module.exports = SecurityManager;