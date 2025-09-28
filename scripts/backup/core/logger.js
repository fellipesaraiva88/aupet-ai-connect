/**
 * Enterprise Logger for Backup System
 * Structured logging with compliance and security features
 */

const fs = require('fs').promises;
const path = require('path');
const util = require('util');

class Logger {
  constructor(module = 'BackupSystem') {
    this.module = module;
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    this.setupLogger();
  }

  setupLogger() {
    // Ensure log directory exists
    this.logDir = process.env.LOG_DIR || '/var/log/auzap-backup';
    this.ensureLogDirectory();

    // Setup log rotation
    this.maxLogSize = 100 * 1024 * 1024; // 100MB
    this.maxLogFiles = 10;
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      module: this.module,
      message: typeof message === 'string' ? message : util.inspect(message),
      pid: process.pid,
      ...meta
    };

    // Sanitize sensitive data
    return this.sanitizeLogEntry(logEntry);
  }

  sanitizeLogEntry(entry) {
    // Remove or mask sensitive information
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth'];
    const sanitized = { ...entry };

    function sanitizeObject(obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          sanitizeObject(value);
        } else if (typeof value === 'string') {
          // Check if field name suggests sensitive data
          const fieldLower = key.toLowerCase();
          if (sensitiveFields.some(sensitive => fieldLower.includes(sensitive))) {
            obj[key] = '***REDACTED***';
          }
          // Mask potential PII patterns
          else if (this.isPotentialPII(value)) {
            obj[key] = this.maskPII(value);
          }
        }
      }
    }

    sanitizeObject(sanitized);
    return sanitized;
  }

  isPotentialPII(value) {
    // Simple patterns for common PII
    const patterns = [
      /\b[\w\.-]+@[\w\.-]+\.\w+\b/, // Email
      /\b\d{3}-\d{2}-\d{4}\b/,      // SSN
      /\b\d{3}-\d{3}-\d{4}\b/,      // Phone
      /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/ // Credit card
    ];

    return patterns.some(pattern => pattern.test(value));
  }

  maskPII(value) {
    // Email: keep first letter and domain
    if (value.includes('@')) {
      const [local, domain] = value.split('@');
      return `${local[0]}***@${domain}`;
    }

    // Other patterns: show first and last 2 characters
    if (value.length > 4) {
      return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
    }

    return '***';
  }

  async writeLog(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    const logLine = JSON.stringify(formattedMessage) + '\n';

    // Write to console
    console.log(logLine.trim());

    // Write to file
    try {
      const logFile = path.join(this.logDir, `backup-${level}.log`);
      await this.writeLogFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log file:', error);
    }

    // Send to external systems if configured
    await this.sendToExternalSystems(level, formattedMessage);
  }

  async writeLogFile(logFile, logLine) {
    try {
      // Check file size and rotate if needed
      try {
        const stats = await fs.stat(logFile);
        if (stats.size > this.maxLogSize) {
          await this.rotateLogFile(logFile);
        }
      } catch (error) {
        // File doesn't exist, that's OK
      }

      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

  async rotateLogFile(logFile) {
    try {
      const extension = path.extname(logFile);
      const baseName = path.basename(logFile, extension);
      const directory = path.dirname(logFile);

      // Rotate existing files
      for (let i = this.maxLogFiles - 1; i > 0; i--) {
        const oldFile = path.join(directory, `${baseName}.${i}${extension}`);
        const newFile = path.join(directory, `${baseName}.${i + 1}${extension}`);

        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
          // File doesn't exist, continue
        }
      }

      // Move current log to .1
      const rotatedFile = path.join(directory, `${baseName}.1${extension}`);
      await fs.rename(logFile, rotatedFile);

    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  async sendToExternalSystems(level, logEntry) {
    // Send to Slack for errors and warnings
    if ((level === 'error' || level === 'warn') && process.env.SLACK_WEBHOOK_URL) {
      await this.sendToSlack(level, logEntry);
    }

    // Send to SIEM if configured
    if (process.env.SIEM_ENDPOINT) {
      await this.sendToSIEM(logEntry);
    }

    // Send to monitoring service
    if (process.env.MONITORING_ENDPOINT) {
      await this.sendToMonitoring(level, logEntry);
    }
  }

  async sendToSlack(level, logEntry) {
    try {
      const webhook = process.env.SLACK_WEBHOOK_URL;
      if (!webhook) return;

      const color = level === 'error' ? 'danger' : 'warning';
      const payload = {
        attachments: [{
          color,
          title: `Backup System ${level.toUpperCase()}`,
          fields: [
            {
              title: 'Module',
              value: logEntry.module,
              short: true
            },
            {
              title: 'Message',
              value: logEntry.message,
              short: false
            },
            {
              title: 'Timestamp',
              value: logEntry.timestamp,
              short: true
            }
          ]
        }]
      };

      // Send to Slack (implementation would use HTTP client)
      // await this.httpPost(webhook, payload);

    } catch (error) {
      console.error('Failed to send to Slack:', error);
    }
  }

  async sendToSIEM(logEntry) {
    try {
      const endpoint = process.env.SIEM_ENDPOINT;
      if (!endpoint) return;

      // Format for SIEM (Common Event Format or similar)
      const siemEvent = {
        timestamp: logEntry.timestamp,
        severity: this.mapLevelToSeverity(logEntry.level),
        source: 'auzap-backup-system',
        category: 'backup-operation',
        description: logEntry.message,
        module: logEntry.module,
        metadata: logEntry
      };

      // Send to SIEM (implementation would use HTTP client)
      // await this.httpPost(endpoint, siemEvent);

    } catch (error) {
      console.error('Failed to send to SIEM:', error);
    }
  }

  async sendToMonitoring(level, logEntry) {
    try {
      const endpoint = process.env.MONITORING_ENDPOINT;
      if (!endpoint) return;

      // Create monitoring metric
      const metric = {
        name: 'backup_system_log_event',
        value: 1,
        tags: {
          level: logEntry.level,
          module: logEntry.module,
          severity: this.mapLevelToSeverity(logEntry.level)
        },
        timestamp: new Date(logEntry.timestamp).getTime()
      };

      // Send to monitoring service
      // await this.httpPost(endpoint, metric);

    } catch (error) {
      console.error('Failed to send to monitoring:', error);
    }
  }

  mapLevelToSeverity(level) {
    const mapping = {
      'ERROR': 'high',
      'WARN': 'medium',
      'INFO': 'low',
      'DEBUG': 'low',
      'TRACE': 'low'
    };
    return mapping[level] || 'low';
  }

  // Public logging methods
  error(message, meta = {}) {
    return this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    return this.writeLog('warn', message, meta);
  }

  info(message, meta = {}) {
    return this.writeLog('info', message, meta);
  }

  debug(message, meta = {}) {
    return this.writeLog('debug', message, meta);
  }

  trace(message, meta = {}) {
    return this.writeLog('trace', message, meta);
  }

  // Structured logging for specific events
  async logBackupEvent(event, details = {}) {
    await this.info('Backup event', {
      eventType: 'backup',
      event,
      ...details
    });
  }

  async logSecurityEvent(event, details = {}) {
    await this.warn('Security event', {
      eventType: 'security',
      event,
      ...details
    });
  }

  async logComplianceEvent(event, details = {}) {
    await this.info('Compliance event', {
      eventType: 'compliance',
      event,
      ...details
    });
  }

  async logPerformanceEvent(event, details = {}) {
    await this.debug('Performance event', {
      eventType: 'performance',
      event,
      ...details
    });
  }

  // Query methods for log analysis
  async queryLogs(criteria = {}) {
    try {
      const {
        level,
        module,
        startTime,
        endTime,
        limit = 100
      } = criteria;

      // Implementation would search log files or query log database
      // For now, return empty array
      return [];

    } catch (error) {
      await this.error('Log query failed', { criteria, error: error.message });
      throw error;
    }
  }

  async getLogMetrics(timeRange = '1h') {
    try {
      // Implementation would analyze logs and return metrics
      return {
        totalEvents: 0,
        errorCount: 0,
        warnCount: 0,
        infoCount: 0,
        debugCount: 0,
        moduleBreakdown: {},
        timeRange
      };

    } catch (error) {
      await this.error('Failed to get log metrics', { timeRange, error: error.message });
      throw error;
    }
  }

  // Log health check
  async healthCheck() {
    try {
      const testMessage = 'Logger health check';
      await this.info(testMessage);

      // Check log directory accessibility
      await fs.access(this.logDir);

      // Check external system connectivity
      const externalSystems = {
        slack: !!process.env.SLACK_WEBHOOK_URL,
        siem: !!process.env.SIEM_ENDPOINT,
        monitoring: !!process.env.MONITORING_ENDPOINT
      };

      return {
        status: 'healthy',
        logDirectory: this.logDir,
        logLevel: this.logLevel,
        externalSystems,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = Logger;