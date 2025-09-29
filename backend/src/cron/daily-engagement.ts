import cron from 'node-cron';
import { ProactiveEngagementEngine } from '../services/ai/proactive-engagement';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';

/**
 * Cron Job para Follow-ups Proativos Diários
 * Roda todo dia às 9h da manhã
 */

export class DailyEngagementCron {
  private engagementEngine: ProactiveEngagementEngine;
  private supabaseService: SupabaseService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.engagementEngine = new ProactiveEngagementEngine();
    this.supabaseService = new SupabaseService();
  }

  /**
   * Inicia o cron job
   */
  start() {
    // Roda todo dia às 9h (horário de Brasília)
    // Formato: segundo minuto hora dia mês dia_da_semana
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      logger.info('=== Starting Daily Engagement Cron ===');
      await this.runDailyFollowups();
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
    });

    logger.info('Daily Engagement Cron scheduled for 9 AM daily (America/Sao_Paulo)');
  }

  /**
   * Para o cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('Daily Engagement Cron stopped');
    }
  }

  /**
   * Executa follow-ups para todas as organizações
   */
  private async runDailyFollowups() {
    try {
      const startTime = Date.now();

      // Buscar todas as organizações ativas
      const { data: organizations } = await this.supabaseService.supabase
        .from('profiles')
        .select('organization_id')
        .not('organization_id', 'is', null);

      if (!organizations || organizations.length === 0) {
        logger.info('No organizations found for daily follow-ups');
        return;
      }

      const uniqueOrgs = [...new Set(organizations.map(o => o.organization_id))];

      logger.info(`Processing follow-ups for ${uniqueOrgs.length} organizations`);

      let totalProcessed = 0;
      let totalSent = 0;
      let totalSkipped = 0;

      // Processar cada organização
      for (const orgId of uniqueOrgs) {
        if (orgId) {
          const result = await this.engagementEngine.processDailyFollowups(orgId);

          totalProcessed += result.processed;
          totalSent += result.sent;
          totalSkipped += result.skipped;

          logger.info('Organization follow-ups completed', {
            organizationId: orgId,
            ...result
          });

          // Aguarda 1s entre organizações para não sobrecarregar
          await this.sleep(1000);
        }
      }

      const duration = Date.now() - startTime;

      logger.info('=== Daily Engagement Cron Completed ===', {
        organizations: uniqueOrgs.length,
        totalProcessed,
        totalSent,
        totalSkipped,
        durationMs: duration
      });

    } catch (error) {
      logger.error('Error running daily follow-ups:', error);
    }
  }

  /**
   * Executa manualmente (para testes)
   */
  async runManually() {
    logger.info('Running Daily Engagement Cron manually...');
    await this.runDailyFollowups();
  }

  /**
   * Aguarda um tempo
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}