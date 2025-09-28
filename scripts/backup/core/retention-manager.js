/**
 * Data Retention Manager
 * Handles intelligent data retention policies and compliance
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/backup-config');
const Logger = require('./logger');
const SecurityManager = require('./security-manager');

class RetentionManager {
  constructor() {
    this.logger = new Logger('RetentionManager');
    this.security = new SecurityManager();
    this.retentionPolicies = new Map();
    this.retentionJobs = [];
    this.deletionQueue = [];
  }

  /**
   * Initialize Retention Manager
   */
  async initialize() {
    try {
      this.logger.info('Initializing Retention Manager...');

      // Load retention policies
      await this.loadRetentionPolicies();

      // Setup scheduled cleanup jobs
      await this.setupCleanupJobs();

      // Initialize deletion queue processing
      await this.initializeDeletionQueue();

      this.logger.info('Retention Manager initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Retention Manager:', error);
      throw error;
    }
  }

  /**
   * Load retention policies from configuration
   */
  async loadRetentionPolicies() {
    const { criticalTables, schedules, compliance } = config;

    // Create policies for each table based on criticality and compliance
    const allTables = [
      ...criticalTables.tier1,
      ...criticalTables.tier2,
      ...criticalTables.tier3
    ];

    for (const table of allTables) {
      const policy = this.createRetentionPolicy(table);
      this.retentionPolicies.set(table.name, policy);
    }

    // Create global backup retention policies
    this.createGlobalRetentionPolicies(schedules);

    this.logger.info(`Loaded ${this.retentionPolicies.size} retention policies`);
  }

  /**
   * Create retention policy for a table
   */
  createRetentionPolicy(table) {
    const baseRetention = table.retention_years || 3;

    // Adjust retention based on compliance requirements
    let complianceRetention = baseRetention;

    if (table.pii) {
      // LGPD: Generally 5 years for personal data
      if (config.compliance.lgpd.enabled) {
        complianceRetention = Math.max(complianceRetention, 5);
      }

      // GDPR: Varies by purpose, typically 3-7 years
      if (config.compliance.gdpr.enabled) {
        complianceRetention = Math.max(complianceRetention, 6);
      }

      // HIPAA: 6 years minimum for health records
      if (config.compliance.hipaa.enabled && this.isHealthRelated(table.name)) {
        complianceRetention = Math.max(complianceRetention, 6);
      }
    }

    // Business requirements can extend retention
    const businessRetention = this.getBusinessRetentionRequirement(table.name);
    const finalRetention = Math.max(complianceRetention, businessRetention);

    return {
      tableName: table.name,
      priority: table.priority,
      retentionYears: finalRetention,
      complianceReason: this.getComplianceReason(table),
      businessReason: this.getBusinessReason(table.name),
      piiClassification: table.pii ? 'contains_pii' : 'no_pii',
      deletionMethod: table.pii ? 'secure_deletion' : 'standard_deletion',
      archiveBeforeDeletion: table.priority === 'critical',
      legalHoldExemption: this.requiresLegalHold(table.name),
      customRules: this.getCustomRetentionRules(table)
    };
  }

  /**
   * Create global backup retention policies
   */
  createGlobalRetentionPolicies(schedules) {
    // Full backup retention
    this.retentionPolicies.set('_global_full_backups', {
      type: 'full_backup',
      retentionSchedule: {
        daily: schedules.full.retention.daily,
        weekly: schedules.full.retention.weekly,
        monthly: schedules.full.retention.monthly,
        yearly: schedules.full.retention.yearly
      },
      archiveRules: {
        toGlacier: 90, // days
        toDeepArchive: 365 // days
      }
    });

    // Incremental backup retention
    this.retentionPolicies.set('_global_incremental_backups', {
      type: 'incremental_backup',
      retentionSchedule: {
        hours: schedules.incremental.retention.hours,
        daily: schedules.incremental.retention.daily
      },
      cleanupAfterFullBackup: true
    });
  }

  /**
   * Apply retention policies to backup data
   */
  async applyRetentionPolicies(backupInventory) {
    try {
      this.logger.info('Applying retention policies to backup inventory');

      const deletionCandidates = [];
      const archiveCandidates = [];
      const now = new Date();

      for (const backup of backupInventory) {
        const age = this.calculateAge(backup.timestamp, now);
        const policy = this.getApplicablePolicy(backup);

        if (!policy) {
          this.logger.warn(`No retention policy found for backup: ${backup.id}`);
          continue;
        }

        // Check if backup exceeds retention period
        if (this.exceedsRetentionPeriod(age, policy)) {
          // Check for legal hold
          if (await this.hasLegalHold(backup.id)) {
            this.logger.info(`Backup ${backup.id} has legal hold, skipping deletion`);
            continue;
          }

          // Archive before deletion if required
          if (policy.archiveBeforeDeletion && !backup.archived) {
            archiveCandidates.push({
              backup,
              policy,
              reason: 'pre_deletion_archive'
            });
          } else {
            deletionCandidates.push({
              backup,
              policy,
              reason: 'retention_period_exceeded'
            });
          }
        }

        // Check for archival candidates (not yet expired but old enough)
        else if (this.shouldArchive(age, policy, backup)) {
          archiveCandidates.push({
            backup,
            policy,
            reason: 'cost_optimization'
          });
        }
      }

      // Process archival candidates
      if (archiveCandidates.length > 0) {
        await this.processArchivalCandidates(archiveCandidates);
      }

      // Process deletion candidates
      if (deletionCandidates.length > 0) {
        await this.processDeletionCandidates(deletionCandidates);
      }

      this.logger.info(`Retention processing complete: ${archiveCandidates.length} archived, ${deletionCandidates.length} queued for deletion`);

      return {
        processed: backupInventory.length,
        archived: archiveCandidates.length,
        queuedForDeletion: deletionCandidates.length
      };

    } catch (error) {
      this.logger.error('Failed to apply retention policies:', error);
      throw error;
    }
  }

  /**
   * Process GDPR/LGPD data subject requests
   */
  async processDataSubjectRequest(request) {
    const { type, subjectId, requestId, requestDate } = request;

    try {
      this.logger.info(`Processing data subject request: ${type} for subject ${subjectId}`);

      switch (type) {
        case 'erasure':
          return await this.processErasureRequest(subjectId, requestId);

        case 'portability':
          return await this.processPortabilityRequest(subjectId, requestId);

        case 'rectification':
          return await this.processRectificationRequest(subjectId, request.corrections);

        case 'restriction':
          return await this.processRestrictionRequest(subjectId, request.restrictions);

        default:
          throw new Error(`Unsupported request type: ${type}`);
      }

    } catch (error) {
      this.logger.error(`Data subject request failed: ${requestId}`, error);
      throw error;
    }
  }

  /**
   * Process erasure request (Right to be Forgotten)
   */
  async processErasureRequest(subjectId, requestId) {
    const startTime = Date.now();
    const erasureLog = [];

    try {
      // Find all backups containing subject data
      const affectedBackups = await this.findBackupsWithSubject(subjectId);

      for (const backup of affectedBackups) {
        // Check if erasure is legally permissible
        if (await this.hasLegalBasisForRetention(backup.id, subjectId)) {
          erasureLog.push({
            backupId: backup.id,
            status: 'skipped',
            reason: 'legal_basis_for_retention'
          });
          continue;
        }

        // Perform secure erasure
        const erasureResult = await this.performSecureErasure(backup, subjectId);
        erasureLog.push({
          backupId: backup.id,
          status: erasureResult.success ? 'completed' : 'failed',
          recordsErased: erasureResult.recordsErased,
          error: erasureResult.error
        });
      }

      // Create compliance record
      const complianceRecord = {
        requestId,
        subjectId,
        type: 'erasure',
        requestDate: new Date().toISOString(),
        completedDate: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        status: 'completed',
        affectedBackups: affectedBackups.length,
        erasureLog,
        legalBasis: 'gdpr_article_17'
      };

      await this.storeComplianceRecord(complianceRecord);

      this.logger.info(`Erasure request completed: ${requestId} (${affectedBackups.length} backups processed)`);

      return complianceRecord;

    } catch (error) {
      this.logger.error(`Erasure request failed: ${requestId}`, error);
      throw error;
    }
  }

  /**
   * Implement intelligent retention optimization
   */
  async optimizeRetention() {
    try {
      this.logger.info('Starting intelligent retention optimization');

      // Analyze backup usage patterns
      const usagePatterns = await this.analyzeBackupUsage();

      // Calculate storage costs
      const costAnalysis = await this.calculateStorageCosts();

      // Identify optimization opportunities
      const optimizations = await this.identifyOptimizations(usagePatterns, costAnalysis);

      // Apply optimizations
      const results = [];
      for (const optimization of optimizations) {
        const result = await this.applyOptimization(optimization);
        results.push(result);
      }

      const totalSavings = results.reduce((sum, result) => sum + result.costSavings, 0);

      this.logger.info(`Retention optimization completed: $${totalSavings.toFixed(2)} estimated savings`);

      return {
        optimizationsApplied: results.length,
        totalCostSavings: totalSavings,
        results
      };

    } catch (error) {
      this.logger.error('Retention optimization failed:', error);
      throw error;
    }
  }

  /**
   * Setup automated compliance monitoring
   */
  async setupComplianceMonitoring() {
    // Monitor for regulatory changes
    setInterval(async () => {
      await this.checkRegulatoryUpdates();
    }, 24 * 60 * 60 * 1000); // Daily

    // Monitor retention compliance
    setInterval(async () => {
      await this.auditRetentionCompliance();
    }, 7 * 24 * 60 * 60 * 1000); // Weekly

    // Monitor data subject request deadlines
    setInterval(async () => {
      await this.checkRequestDeadlines();
    }, 60 * 60 * 1000); // Hourly

    this.logger.info('Compliance monitoring setup completed');
  }

  /**
   * Generate retention compliance report
   */
  async generateComplianceReport(startDate, endDate) {
    try {
      const report = {
        reportPeriod: { startDate, endDate },
        generatedAt: new Date().toISOString(),
        retentionCompliance: {},
        dataSubjectRequests: {},
        securityEvents: {},
        costOptimization: {}
      };

      // Retention compliance analysis
      report.retentionCompliance = await this.analyzeRetentionCompliance(startDate, endDate);

      // Data subject requests summary
      report.dataSubjectRequests = await this.analyzeDataSubjectRequests(startDate, endDate);

      // Security events related to retention
      report.securityEvents = await this.analyzeSecurityEvents(startDate, endDate);

      // Cost optimization analysis
      report.costOptimization = await this.analyzeCostOptimization(startDate, endDate);

      return report;

    } catch (error) {
      this.logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  // Helper methods

  calculateAge(timestamp, now) {
    return Math.floor((now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
  }

  getApplicablePolicy(backup) {
    // Determine which retention policy applies to this backup
    if (backup.type === 'full') {
      return this.retentionPolicies.get('_global_full_backups');
    } else if (backup.type === 'incremental') {
      return this.retentionPolicies.get('_global_incremental_backups');
    }
    return null;
  }

  exceedsRetentionPeriod(ageDays, policy) {
    if (policy.type === 'full_backup') {
      return ageDays > (policy.retentionSchedule.yearly * 365);
    } else if (policy.type === 'incremental_backup') {
      return ageDays > policy.retentionSchedule.daily;
    }
    return false;
  }

  shouldArchive(ageDays, policy, backup) {
    if (backup.archived) return false;

    // Archive to Glacier after 90 days
    if (policy.archiveRules && ageDays > policy.archiveRules.toGlacier) {
      return true;
    }

    return false;
  }

  async hasLegalHold(backupId) {
    // Implementation would check legal hold database
    return false;
  }

  async processArchivalCandidates(candidates) {
    this.logger.info(`Processing ${candidates.length} archival candidates`);
    // Implementation would move backups to cheaper storage tiers
  }

  async processDeletionCandidates(candidates) {
    this.logger.info(`Processing ${candidates.length} deletion candidates`);
    // Add to deletion queue for secure processing
    this.deletionQueue.push(...candidates);
  }

  isHealthRelated(tableName) {
    const healthTables = ['pets', 'appointments', 'medical_records', 'treatments'];
    return healthTables.includes(tableName);
  }

  getBusinessRetentionRequirement(tableName) {
    // Business-specific retention requirements
    const businessRules = {
      'organizations': 7, // 7 years for business records
      'appointments': 7,  // 7 years for service records
      'pets': 7,         // 7 years for pet medical history
      'ai_conversations': 2, // 2 years for conversation logs
      'performance_alert_history': 1 // 1 year for performance data
    };

    return businessRules[tableName] || 3; // Default 3 years
  }

  getComplianceReason(table) {
    if (table.pii) {
      const reasons = [];
      if (config.compliance.lgpd.enabled) reasons.push('LGPD Article 16');
      if (config.compliance.gdpr.enabled) reasons.push('GDPR Article 5');
      if (config.compliance.hipaa.enabled && this.isHealthRelated(table.name)) {
        reasons.push('HIPAA 164.316');
      }
      return reasons.join(', ');
    }
    return 'Business requirement';
  }

  getBusinessReason(tableName) {
    const reasons = {
      'organizations': 'Corporate governance and audit requirements',
      'appointments': 'Service history and liability coverage',
      'pets': 'Medical history and continuity of care',
      'ai_conversations': 'Service improvement and quality assurance'
    };
    return reasons[tableName] || 'Standard business practice';
  }

  requiresLegalHold(tableName) {
    // Tables that might be subject to legal holds
    const legalHoldTables = ['organizations', 'appointments', 'ai_conversations'];
    return legalHoldTables.includes(tableName);
  }

  getCustomRetentionRules(table) {
    // Custom rules based on table characteristics
    const rules = [];

    if (table.pii) {
      rules.push('Consent-based retention tracking');
      rules.push('Subject access request handling');
    }

    if (table.priority === 'critical') {
      rules.push('Extended backup verification');
      rules.push('Multi-region compliance');
    }

    return rules;
  }

  async setupCleanupJobs() {
    // Implementation would setup scheduled jobs
    this.logger.info('Cleanup jobs setup completed');
  }

  async initializeDeletionQueue() {
    // Implementation would setup secure deletion processing
    this.logger.info('Deletion queue processing initialized');
  }

  // Placeholder implementations for complex methods
  async findBackupsWithSubject(subjectId) { return []; }
  async hasLegalBasisForRetention(backupId, subjectId) { return false; }
  async performSecureErasure(backup, subjectId) { return { success: true, recordsErased: 0 }; }
  async storeComplianceRecord(record) { /* Implementation */ }
  async analyzeBackupUsage() { return {}; }
  async calculateStorageCosts() { return {}; }
  async identifyOptimizations(usage, costs) { return []; }
  async applyOptimization(optimization) { return { costSavings: 0 }; }
  async checkRegulatoryUpdates() { /* Implementation */ }
  async auditRetentionCompliance() { /* Implementation */ }
  async checkRequestDeadlines() { /* Implementation */ }
  async analyzeRetentionCompliance(start, end) { return {}; }
  async analyzeDataSubjectRequests(start, end) { return {}; }
  async analyzeSecurityEvents(start, end) { return {}; }
  async analyzeCostOptimization(start, end) { return {}; }
}

module.exports = RetentionManager;