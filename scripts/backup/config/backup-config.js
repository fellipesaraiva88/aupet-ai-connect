/**
 * Enterprise Backup Configuration for Auzap AI Connect
 * LGPD/GDPR Compliant Backup System
 */

const crypto = require('crypto');

module.exports = {
  // Database Configuration
  database: {
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT || 5432,
    database: process.env.SUPABASE_DB_NAME,
    username: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
      ca: process.env.SUPABASE_DB_CA_CERT
    }
  },

  // Backup Storage Configuration
  storage: {
    provider: process.env.BACKUP_STORAGE_PROVIDER || 'aws', // aws, gcp, azure, local
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_BACKUP_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      storageClass: 'STANDARD_IA', // Cost optimization
      glacier: {
        enabled: true,
        daysToGlacier: 90,
        daysToDeepArchive: 365
      }
    },
    gcp: {
      projectId: process.env.GCP_PROJECT_ID,
      bucket: process.env.GCP_BACKUP_BUCKET,
      keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY,
      storageClass: 'NEARLINE'
    },
    azure: {
      accountName: process.env.AZURE_STORAGE_ACCOUNT,
      accountKey: process.env.AZURE_STORAGE_KEY,
      container: process.env.AZURE_BACKUP_CONTAINER,
      tier: 'Cool'
    },
    local: {
      path: process.env.LOCAL_BACKUP_PATH || '/var/backups/auzap',
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12
      }
    }
  },

  // Critical Tables with PII Classification
  criticalTables: {
    // Tier 1: Critical Business Data (High Priority)
    tier1: [
      {
        name: 'organizations',
        priority: 'critical',
        pii: false,
        backup_frequency: 'hourly',
        retention_years: 7
      },
      {
        name: 'profiles',
        priority: 'critical',
        pii: true,
        backup_frequency: 'hourly',
        retention_years: 5,
        gdpr_fields: ['email', 'full_name', 'phone', 'whatsapp_number']
      },
      {
        name: 'pets',
        priority: 'critical',
        pii: true,
        backup_frequency: 'hourly',
        retention_years: 7,
        gdpr_fields: ['name', 'owner_id', 'emergency_contact', 'medical_notes']
      },
      {
        name: 'appointments',
        priority: 'critical',
        pii: true,
        backup_frequency: 'hourly',
        retention_years: 7,
        gdpr_fields: ['notes', 'service_notes', 'metadata']
      }
    ],

    // Tier 2: Important Operational Data
    tier2: [
      {
        name: 'ai_conversations',
        priority: 'high',
        pii: true,
        backup_frequency: 'daily',
        retention_years: 3,
        gdpr_fields: ['conversation_data', 'customer_phone']
      },
      {
        name: 'ai_sentiment_analysis',
        priority: 'medium',
        pii: false,
        backup_frequency: 'daily',
        retention_years: 2
      },
      {
        name: 'ai_message_templates',
        priority: 'medium',
        pii: false,
        backup_frequency: 'daily',
        retention_years: 5
      }
    ],

    // Tier 3: Supporting Data
    tier3: [
      {
        name: 'performance_alert_history',
        priority: 'low',
        pii: false,
        backup_frequency: 'weekly',
        retention_years: 1
      },
      {
        name: 'petshop_settings',
        priority: 'medium',
        pii: false,
        backup_frequency: 'daily',
        retention_years: 3
      }
    ]
  },

  // Backup Schedules
  schedules: {
    full: {
      frequency: 'daily',
      time: '02:00', // 2 AM UTC
      compression: true,
      encryption: true,
      retention: {
        daily: 7,
        weekly: 4,
        monthly: 12,
        yearly: 7
      }
    },
    incremental: {
      frequency: 'hourly',
      compression: true,
      encryption: true,
      retention: {
        hours: 24,
        daily: 7
      }
    },
    differential: {
      frequency: '6hours',
      compression: true,
      encryption: true,
      retention: {
        daily: 3
      }
    }
  },

  // Encryption Configuration
  encryption: {
    enabled: true,
    algorithm: 'aes-256-gcm',
    keyRotation: {
      enabled: true,
      intervalDays: 90
    },
    kms: {
      provider: process.env.KMS_PROVIDER || 'aws', // aws, azure, gcp
      keyId: process.env.KMS_KEY_ID,
      region: process.env.KMS_REGION
    }
  },

  // Compliance Settings
  compliance: {
    lgpd: {
      enabled: true,
      dataSubjectRights: true,
      consentTracking: true,
      dataMinimization: true,
      pseudonymization: true
    },
    gdpr: {
      enabled: true,
      rightToBeErasure: true,
      dataPortability: true,
      rightToRectification: true
    },
    hipaa: {
      enabled: true,
      encryption: 'required',
      auditLogs: true,
      accessControls: true
    }
  },

  // Monitoring and Alerting
  monitoring: {
    enabled: true,
    slack: {
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#backup-alerts'
    },
    email: {
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      },
      recipients: process.env.BACKUP_ALERT_EMAILS?.split(',') || []
    },
    webhook: {
      url: process.env.BACKUP_WEBHOOK_URL,
      timeout: 10000
    }
  },

  // Disaster Recovery Settings
  disasterRecovery: {
    rto: 4, // Recovery Time Objective in hours
    rpo: 1, // Recovery Point Objective in hours
    hotStandby: {
      enabled: process.env.DR_HOT_STANDBY === 'true',
      region: process.env.DR_REGION,
      syncInterval: 15 // minutes
    },
    crossRegionReplication: {
      enabled: process.env.DR_CROSS_REGION === 'true',
      regions: process.env.DR_REGIONS?.split(',') || [],
      syncDelay: 300 // seconds
    }
  },

  // Performance Settings
  performance: {
    parallelJobs: parseInt(process.env.BACKUP_PARALLEL_JOBS) || 4,
    chunkSize: '100MB',
    compressionLevel: 6,
    networkTimeout: 300000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 30000 // 30 seconds
  },

  // Security Settings
  security: {
    accessControl: {
      enabled: true,
      rbac: true,
      mfa: process.env.BACKUP_MFA_REQUIRED === 'true'
    },
    auditLog: {
      enabled: true,
      retention: 2555, // 7 years in days
      siem: {
        enabled: process.env.SIEM_ENABLED === 'true',
        endpoint: process.env.SIEM_ENDPOINT
      }
    },
    networkSecurity: {
      vpn: process.env.BACKUP_VPN_REQUIRED === 'true',
      whitelist: process.env.BACKUP_IP_WHITELIST?.split(',') || []
    }
  },

  // Testing Configuration
  testing: {
    automated: {
      enabled: true,
      frequency: 'weekly',
      testTypes: ['integrity', 'restore', 'encryption', 'compression']
    },
    restoreTest: {
      sampleSize: 0.1, // 10% of data
      targetEnvironment: 'staging',
      cleanup: true
    }
  }
};