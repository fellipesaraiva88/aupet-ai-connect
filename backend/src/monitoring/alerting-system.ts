import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import { EnhancedLogger } from './logger';
import { MetricsCollector } from './metrics';
import promClient from 'prom-client';

/**
 * Enterprise Intelligent Alerting System
 * Provides smart alerting with escalation, deduplication, and multiple channels
 */

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertType {
  PERFORMANCE = 'performance',
  ERROR = 'error',
  SECURITY = 'security',
  INFRASTRUCTURE = 'infrastructure',
  BUSINESS = 'business',
  CAPACITY = 'capacity'
}

export enum AlertStatus {
  TRIGGERED = 'triggered',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  condition: string;
  threshold: number;
  duration: number; // seconds
  enabled: boolean;
  channels: AlertChannel[];
  escalation?: EscalationRule;
  suppressionRules?: SuppressionRule[];
  tags?: Record<string, string>;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: any;
  enabled: boolean;
}

export interface EscalationRule {
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  delay: number; // minutes
  channels: AlertChannel[];
  severity: AlertSeverity;
}

export interface SuppressionRule {
  condition: string;
  duration: number; // minutes
  reason: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  type: AlertType;
  status: AlertStatus;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalationLevel: number;
  metadata: Record<string, any>;
  tags: Record<string, string>;
  fingerprint: string;
}

// Alert metrics
export const alertsTriggered = new promClient.Counter({
  name: 'auzap_alerts_triggered_total',
  help: 'Total alerts triggered',
  labelNames: ['severity', 'type', 'rule_id']
});

export const alertsResolved = new promClient.Counter({
  name: 'auzap_alerts_resolved_total',
  help: 'Total alerts resolved',
  labelNames: ['severity', 'type', 'duration_minutes']
});

export const alertNotificationsSent = new promClient.Counter({
  name: 'auzap_alert_notifications_sent_total',
  help: 'Alert notifications sent',
  labelNames: ['channel', 'severity', 'status']
});

export const alertEscalations = new promClient.Counter({
  name: 'auzap_alert_escalations_total',
  help: 'Alert escalations',
  labelNames: ['level', 'severity']
});

/**
 * Intelligent Alerting Manager
 */
export class AlertingSystem {
  private logger: EnhancedLogger;
  private metricsCollector: MetricsCollector;
  private emailTransporter?: nodemailer.Transporter;
  private slackClient?: WebClient;

  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private suppressionTimers: Map<string, NodeJS.Timeout> = new Map();

  private isInitialized: boolean = false;

  constructor(logger: EnhancedLogger, metricsCollector: MetricsCollector) {
    this.logger = logger.child({ component: 'alerting-system' });
    this.metricsCollector = metricsCollector;
  }

  /**
   * Initialize alerting system
   */
  async initialize(): Promise<void> {
    try {
      await this.setupEmailTransporter();
      await this.setupSlackClient();
      this.loadDefaultAlertRules();
      this.startAlertEvaluationLoop();

      this.isInitialized = true;
      this.logger.info('Alerting system initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize alerting system', error);
      throw error;
    }
  }

  /**
   * Setup email transporter
   */
  private async setupEmailTransporter(): Promise<void> {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.emailTransporter = nodemailer.createTransporter(emailConfig);

      // Verify connection
      await this.emailTransporter.verify();
      this.logger.info('Email transporter configured successfully');
    } else {
      this.logger.warn('Email configuration not found, email alerts disabled');
    }
  }

  /**
   * Setup Slack client
   */
  private async setupSlackClient(): Promise<void> {
    const slackToken = process.env.SLACK_BOT_TOKEN;

    if (slackToken) {
      this.slackClient = new WebClient(slackToken);

      // Test connection
      await this.slackClient.auth.test();
      this.logger.info('Slack client configured successfully');
    } else {
      this.logger.warn('Slack configuration not found, Slack alerts disabled');
    }
  }

  /**
   * Load default alert rules
   */
  private loadDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds acceptable threshold',
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        condition: 'auzap_http_requests_total{status_code=~"5.."}',
        threshold: 0.05, // 5% error rate
        duration: 300, // 5 minutes
        enabled: true,
        channels: [
          { type: 'email', config: { recipients: ['ops@auzap.ai'] }, enabled: true },
          { type: 'slack', config: { channel: '#alerts' }, enabled: true }
        ],
        escalation: {
          levels: [
            {
              level: 1,
              delay: 15,
              channels: [{ type: 'slack', config: { channel: '#critical-alerts' }, enabled: true }],
              severity: AlertSeverity.CRITICAL
            }
          ]
        }
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 85%',
        type: AlertType.INFRASTRUCTURE,
        severity: AlertSeverity.MEDIUM,
        condition: 'auzap_memory_usage_bytes{type="heapUsed"}',
        threshold: 0.85,
        duration: 300,
        enabled: true,
        channels: [
          { type: 'slack', config: { channel: '#monitoring' }, enabled: true }
        ]
      },
      {
        id: 'slow-database-queries',
        name: 'Slow Database Queries',
        description: 'Database queries taking longer than expected',
        type: AlertType.PERFORMANCE,
        severity: AlertSeverity.MEDIUM,
        condition: 'auzap_supabase_query_duration_seconds',
        threshold: 2.0, // 2 seconds
        duration: 180,
        enabled: true,
        channels: [
          { type: 'email', config: { recipients: ['dev@auzap.ai'] }, enabled: true }
        ]
      },
      {
        id: 'rate-limit-exceeded',
        name: 'Rate Limit Exceeded',
        description: 'Rate limiting being triggered frequently',
        type: AlertType.SECURITY,
        severity: AlertSeverity.HIGH,
        condition: 'auzap_rate_limit_hits_total',
        threshold: 10,
        duration: 60,
        enabled: true,
        channels: [
          { type: 'email', config: { recipients: ['security@auzap.ai'] }, enabled: true },
          { type: 'slack', config: { channel: '#security' }, enabled: true }
        ]
      },
      {
        id: 'supabase-connection-down',
        name: 'Supabase Connection Down',
        description: 'Lost connection to Supabase database',
        type: AlertType.INFRASTRUCTURE,
        severity: AlertSeverity.CRITICAL,
        condition: 'auzap_supabase_connection_health',
        threshold: 0.5,
        duration: 30,
        enabled: true,
        channels: [
          { type: 'email', config: { recipients: ['ops@auzap.ai', 'dev@auzap.ai'] }, enabled: true },
          { type: 'slack', config: { channel: '#critical-alerts' }, enabled: true }
        ]
      },
      {
        id: 'whatsapp-failure-rate',
        name: 'WhatsApp Message Failure Rate',
        description: 'High failure rate for WhatsApp messages',
        type: AlertType.BUSINESS,
        severity: AlertSeverity.HIGH,
        condition: 'auzap_whatsapp_messages_total{status="failed"}',
        threshold: 0.1, // 10% failure rate
        duration: 300,
        enabled: true,
        channels: [
          { type: 'email', config: { recipients: ['business@auzap.ai'] }, enabled: true },
          { type: 'slack', config: { channel: '#business-alerts' }, enabled: true }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.info('Default alert rules loaded', { ruleCount: defaultRules.length });
  }

  /**
   * Start alert evaluation loop
   */
  private startAlertEvaluationLoop(): void {
    setInterval(async () => {
      await this.evaluateAlertRules();
    }, 30000); // Every 30 seconds

    this.logger.info('Alert evaluation loop started');
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateAlertRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        await this.evaluateRule(rule);
      } catch (error) {
        this.logger.error('Error evaluating alert rule', error, { ruleId });
      }
    }
  }

  /**
   * Evaluate a specific alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      // Get metric value (simplified - in production would query Prometheus)
      const metricValue = await this.getMetricValue(rule.condition);
      const isTriggered = this.evaluateCondition(metricValue, rule.threshold, rule.condition);

      const alertFingerprint = this.generateFingerprint(rule);
      const existingAlert = this.activeAlerts.get(alertFingerprint);

      if (isTriggered && !existingAlert) {
        // Trigger new alert
        await this.triggerAlert(rule, metricValue, alertFingerprint);
      } else if (!isTriggered && existingAlert) {
        // Resolve existing alert
        await this.resolveAlert(existingAlert);
      }

    } catch (error) {
      this.logger.error('Error in rule evaluation', error, { ruleId: rule.id });
    }
  }

  /**
   * Trigger a new alert
   */
  private async triggerAlert(rule: AlertRule, metricValue: number, fingerprint: string): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      title: rule.name,
      description: this.formatAlertDescription(rule, metricValue),
      severity: rule.severity,
      type: rule.type,
      status: AlertStatus.TRIGGERED,
      triggeredAt: new Date(),
      escalationLevel: 0,
      metadata: {
        metricValue,
        threshold: rule.threshold,
        condition: rule.condition
      },
      tags: rule.tags || {},
      fingerprint
    };

    this.activeAlerts.set(fingerprint, alert);
    this.alertHistory.push(alert);

    // Record metrics
    alertsTriggered.labels(alert.severity, alert.type, rule.id).inc();

    // Send notifications
    await this.sendAlertNotifications(alert, rule);

    // Setup escalation if configured
    if (rule.escalation) {
      this.scheduleEscalation(alert, rule);
    }

    this.logger.warn('Alert triggered', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: alert.severity,
      metricValue,
      threshold: rule.threshold
    });
  }

  /**
   * Resolve an existing alert
   */
  private async resolveAlert(alert: Alert): Promise<void> {
    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();

    const duration = alert.resolvedAt.getTime() - alert.triggeredAt.getTime();
    const durationMinutes = Math.round(duration / (1000 * 60));

    // Record metrics
    alertsResolved.labels(alert.severity, alert.type, durationMinutes.toString()).inc();

    // Remove from active alerts
    this.activeAlerts.delete(alert.fingerprint);

    // Cancel escalation timer
    const escalationTimer = this.escalationTimers.get(alert.id);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(alert.id);
    }

    // Send resolution notification
    await this.sendResolutionNotification(alert);

    this.logger.info('Alert resolved', {
      alertId: alert.id,
      ruleId: alert.ruleId,
      duration: durationMinutes + ' minutes'
    });
  }

  /**
   * Send alert notifications through configured channels
   */
  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailNotification(alert, channel.config);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel.config);
            break;
        }

        alertNotificationsSent.labels(channel.type, alert.severity, 'success').inc();

      } catch (error) {
        this.logger.error('Failed to send alert notification', error, {
          alertId: alert.id,
          channel: channel.type
        });

        alertNotificationsSent.labels(channel.type, alert.severity, 'failed').inc();
      }
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, config: any): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
    const html = this.generateEmailTemplate(alert);

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'alerts@auzap.ai',
      to: config.recipients.join(', '),
      subject,
      html
    });

    this.logger.info('Email alert sent', {
      alertId: alert.id,
      recipients: config.recipients
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, config: any): Promise<void> {
    if (!this.slackClient) {
      throw new Error('Slack client not configured');
    }

    const color = this.getSeverityColor(alert.severity);
    const blocks = this.generateSlackBlocks(alert);

    await this.slackClient.chat.postMessage({
      channel: config.channel,
      text: `Alert: ${alert.title}`,
      attachments: [
        {
          color,
          blocks
        }
      ]
    });

    this.logger.info('Slack alert sent', {
      alertId: alert.id,
      channel: config.channel
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, config: any): Promise<void> {
    const payload = {
      alert,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    this.logger.info('Webhook alert sent', {
      alertId: alert.id,
      url: config.url
    });
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert): Promise<void> {
    const rule = this.alertRules.get(alert.ruleId);
    if (!rule) return;

    for (const channel of rule.channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'slack':
            await this.sendSlackResolution(alert, channel.config);
            break;
          case 'email':
            await this.sendEmailResolution(alert, channel.config);
            break;
        }
      } catch (error) {
        this.logger.error('Failed to send resolution notification', error, {
          alertId: alert.id,
          channel: channel.type
        });
      }
    }
  }

  /**
   * Schedule alert escalation
   */
  private scheduleEscalation(alert: Alert, rule: AlertRule): void {
    if (!rule.escalation) return;

    const escalateToLevel = (level: number) => {
      const escalationLevel = rule.escalation!.levels.find(l => l.level === level);
      if (!escalationLevel) return;

      const timer = setTimeout(async () => {
        // Check if alert is still active
        if (this.activeAlerts.has(alert.fingerprint)) {
          alert.escalationLevel = level;
          alert.severity = escalationLevel.severity;

          alertEscalations.labels(level.toString(), alert.severity).inc();

          // Send escalation notifications
          for (const channel of escalationLevel.channels) {
            try {
              switch (channel.type) {
                case 'email':
                  await this.sendEmailNotification(alert, channel.config);
                  break;
                case 'slack':
                  await this.sendSlackNotification(alert, channel.config);
                  break;
              }
            } catch (error) {
              this.logger.error('Escalation notification failed', error);
            }
          }

          this.logger.warn('Alert escalated', {
            alertId: alert.id,
            level,
            newSeverity: alert.severity
          });

          // Schedule next escalation if available
          const nextLevel = rule.escalation!.levels.find(l => l.level === level + 1);
          if (nextLevel) {
            escalateToLevel(level + 1);
          }
        }
      }, escalationLevel.delay * 60 * 1000); // Convert minutes to milliseconds

      this.escalationTimers.set(alert.id, timer);
    };

    // Start with level 1
    escalateToLevel(1);
  }

  /**
   * Utility methods
   */
  private async getMetricValue(condition: string): Promise<number> {
    // Simplified metric retrieval - in production would query Prometheus
    // This is a placeholder implementation
    const metricMap: Record<string, () => number> = {
      'auzap_http_requests_total{status_code=~"5.."}': () => Math.random() * 0.1,
      'auzap_memory_usage_bytes{type="heapUsed"}': () => Math.random(),
      'auzap_supabase_query_duration_seconds': () => Math.random() * 3,
      'auzap_rate_limit_hits_total': () => Math.random() * 20,
      'auzap_supabase_connection_health': () => Math.random(),
      'auzap_whatsapp_messages_total{status="failed"}': () => Math.random() * 0.2
    };

    const getValue = metricMap[condition];
    return getValue ? getValue() : 0;
  }

  private evaluateCondition(value: number, threshold: number, condition: string): boolean {
    // Simplified condition evaluation
    if (condition.includes('connection_health')) {
      return value < threshold; // Health should be above threshold
    }
    return value > threshold; // Most metrics should be below threshold
  }

  private generateFingerprint(rule: AlertRule): string {
    return `${rule.id}-${rule.type}-${rule.severity}`;
  }

  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatAlertDescription(rule: AlertRule, metricValue: number): string {
    return `${rule.description}. Current value: ${metricValue.toFixed(2)}, Threshold: ${rule.threshold}`;
  }

  private generateEmailTemplate(alert: Alert): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="background-color: ${this.getSeverityColor(alert.severity)}; color: white; padding: 10px;">
            <h2>🚨 Alert: ${alert.title}</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Type:</strong> ${alert.type}</p>
            <p><strong>Description:</strong> ${alert.description}</p>
            <p><strong>Triggered At:</strong> ${alert.triggeredAt.toISOString()}</p>
            <p><strong>Alert ID:</strong> ${alert.id}</p>

            <h3>Metadata:</h3>
            <ul>
              ${Object.entries(alert.metadata).map(([key, value]) =>
                `<li><strong>${key}:</strong> ${value}</li>`
              ).join('')}
            </ul>
          </div>
        </body>
      </html>
    `;
  }

  private generateSlackBlocks(alert: Alert): any[] {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🚨 ${alert.title}*\n${alert.description}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Severity:*\n${alert.severity.toUpperCase()}`
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${alert.type}`
          },
          {
            type: 'mrkdwn',
            text: `*Triggered:*\n${alert.triggeredAt.toLocaleString()}`
          },
          {
            type: 'mrkdwn',
            text: `*Alert ID:*\n${alert.id}`
          }
        ]
      }
    ];
  }

  private async sendSlackResolution(alert: Alert, config: any): Promise<void> {
    if (!this.slackClient) return;

    const duration = alert.resolvedAt!.getTime() - alert.triggeredAt.getTime();
    const durationText = this.formatDuration(duration);

    await this.slackClient.chat.postMessage({
      channel: config.channel,
      text: `✅ Alert Resolved: ${alert.title}`,
      attachments: [
        {
          color: 'good',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*✅ Alert Resolved: ${alert.title}*\nDuration: ${durationText}`
              }
            }
          ]
        }
      ]
    });
  }

  private async sendEmailResolution(alert: Alert, config: any): Promise<void> {
    if (!this.emailTransporter) return;

    const duration = alert.resolvedAt!.getTime() - alert.triggeredAt.getTime();
    const durationText = this.formatDuration(duration);

    const subject = `[RESOLVED] ${alert.title}`;
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="background-color: #28a745; color: white; padding: 10px;">
            <h2>✅ Alert Resolved: ${alert.title}</h2>
          </div>
          <div style="padding: 20px;">
            <p><strong>Resolution Time:</strong> ${durationText}</p>
            <p><strong>Resolved At:</strong> ${alert.resolvedAt!.toISOString()}</p>
          </div>
        </body>
      </html>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'alerts@auzap.ai',
      to: config.recipients.join(', '),
      subject,
      html
    });
  }

  private getSeverityColor(severity: AlertSeverity): string {
    const colors = {
      [AlertSeverity.LOW]: '#17a2b8',
      [AlertSeverity.MEDIUM]: '#ffc107',
      [AlertSeverity.HIGH]: '#fd7e14',
      [AlertSeverity.CRITICAL]: '#dc3545'
    };
    return colors[severity];
  }

  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Public API methods
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.info('Alert rule added', { ruleId: rule.id });
  }

  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.logger.info('Alert rule removed', { ruleId });
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  acknowledgeAlert(alertId: string): void {
    const alert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (alert) {
      alert.status = AlertStatus.ACKNOWLEDGED;
      alert.acknowledgedAt = new Date();
      this.logger.info('Alert acknowledged', { alertId });
    }
  }

  suppressAlert(alertId: string, duration: number, reason: string): void {
    const alert = Array.from(this.activeAlerts.values()).find(a => a.id === alertId);
    if (alert) {
      alert.status = AlertStatus.SUPPRESSED;

      const timer = setTimeout(() => {
        if (alert.status === AlertStatus.SUPPRESSED) {
          alert.status = AlertStatus.TRIGGERED;
        }
        this.suppressionTimers.delete(alertId);
      }, duration * 60 * 1000);

      this.suppressionTimers.set(alertId, timer);
      this.logger.info('Alert suppressed', { alertId, duration, reason });
    }
  }
}

export default AlertingSystem;