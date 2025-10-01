import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

import { EvolutionAPIUnifiedService } from '../services/evolution-api-unified';
import { SupabaseService } from '../services/supabase';
import { logger } from '../utils/logger';

interface MigrationResult {
  totalProcessed: number;
  migrated: number;
  errors: number;
  skipped: number;
  details: Array<{
    oldInstanceName: string;
    newInstanceName?: string;
    userId?: string;
    status: 'migrated' | 'error' | 'skipped';
    error?: string;
  }>;
}

class WhatsAppInstanceMigrator {
  private evolutionService: EvolutionAPIUnifiedService;
  private supabaseService: SupabaseService;

  constructor() {
    const baseURL = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!baseURL || !apiKey) {
      throw new Error('Missing EVOLUTION_API_URL or EVOLUTION_API_KEY');
    }

    this.evolutionService = new EvolutionAPIUnifiedService({ baseURL, apiKey });
    this.supabaseService = new SupabaseService();
  }

  /**
   * Executa a migração completa
   */
  async migrate(): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalProcessed: 0,
      migrated: 0,
      errors: 0,
      skipped: 0,
      details: []
    };

    try {
      logger.info('Starting WhatsApp instances migration...');

      // 1. Buscar todas as instâncias da Evolution API
      const evolutionInstances = await this.evolutionService.fetchInstances();
      result.totalProcessed = evolutionInstances.length;

      logger.info(`Found ${evolutionInstances.length} instances to process`);

      // 2. Processar cada instância
      for (const instance of evolutionInstances) {
        try {
          await this.processInstance(instance, result);
        } catch (error) {
          logger.error(`Error processing instance ${instance.instanceName}:`, error);
          result.errors++;
          result.details.push({
            oldInstanceName: instance.instanceName || 'unknown',
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('Migration completed', {
        totalProcessed: result.totalProcessed,
        migrated: result.migrated,
        errors: result.errors,
        skipped: result.skipped
      });

      return result;
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Processa uma instância individual
   */
  private async processInstance(instance: any, result: MigrationResult): Promise<void> {
    const instanceName = instance.instanceName || instance.name;

    if (!instanceName) {
      result.skipped++;
      result.details.push({
        oldInstanceName: 'no-name',
        status: 'skipped',
        error: 'Instance has no name'
      });
      return;
    }

    // Verificar se é instância no formato antigo que precisa de migração
    if (!instanceName.startsWith('auzap_') && !instanceName.startsWith('user_')) {
      result.skipped++;
      result.details.push({
        oldInstanceName: instanceName,
        status: 'skipped',
        error: 'Not a recognized instance format'
      });
      return;
    }

    // Se já está no formato novo, pular
    if (instanceName.startsWith('user_')) {
      // Verificar se existe no banco
      const existingInstance = await this.supabaseService.getInstanceByName(instanceName);

      if (!existingInstance) {
        // Instância no formato novo mas não está no banco, criar registro
        await this.createDatabaseRecord(instanceName, 'unknown', instance, result);
      } else {
        result.skipped++;
        result.details.push({
          oldInstanceName: instanceName,
          status: 'skipped',
          error: 'Already in new format and in database'
        });
      }
      return;
    }

    // Processar instância no formato antigo (auzap_)
    await this.migrateOldInstance(instanceName, instance, result);
  }

  /**
   * Migra uma instância do formato antigo
   */
  private async migrateOldInstance(
    instanceName: string,
    instance: any,
    result: MigrationResult
  ): Promise<void> {
    // Extrair ID do usuário do nome da instância
    const businessId = instanceName.replace('auzap_', '');

    // Por simplicidade, vamos usar o businessId como userId
    // Em um cenário real, você faria uma consulta para encontrar o userId correspondente
    const userId = businessId;

    if (!userId) {
      result.errors++;
      result.details.push({
        oldInstanceName: instanceName,
        status: 'error',
        error: 'Could not extract user ID from instance name'
      });
      return;
    }

    const newInstanceName = `user_${userId}`;

    // Verificar se já existe uma instância com o novo nome
    const existingInstance = await this.supabaseService.getInstanceByName(newInstanceName);

    if (existingInstance) {
      result.skipped++;
      result.details.push({
        oldInstanceName: instanceName,
        newInstanceName,
        userId,
        status: 'skipped',
        error: 'New instance name already exists in database'
      });
      return;
    }

    // Criar registro no banco com novo formato
    await this.createDatabaseRecord(newInstanceName, userId, instance, result);

    // Atualizar webhook para o novo formato (opcional)
    try {
      const webhookUrl = `${process.env.WEBHOOK_URL}/api/webhook/user/${userId}`;
      await this.evolutionService.setWebhook(instanceName, webhookUrl);
      logger.info(`Updated webhook for ${instanceName} -> ${newInstanceName}`);
    } catch (error) {
      logger.warn(`Could not update webhook for ${instanceName}:`, error);
    }

    result.migrated++;
    result.details.push({
      oldInstanceName: instanceName,
      newInstanceName,
      userId,
      status: 'migrated'
    });

    logger.info(`Migrated instance: ${instanceName} -> ${newInstanceName}`);
  }

  /**
   * Cria registro no banco de dados
   */
  private async createDatabaseRecord(
    instanceName: string,
    userId: string,
    instance: any,
    result: MigrationResult
  ): Promise<void> {
    try {
      await this.supabaseService.createInstance({
        name: instanceName,
        status: instance.status || instance.connectionStatus || 'created',
        organization_id: 'migrated' // Identificar como migrado
      });

      logger.info(`Created database record for ${instanceName}`);
    } catch (error) {
      logger.error(`Error creating database record for ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Exibe relatório da migração
   */
  printReport(result: MigrationResult): void {
    console.log('\n=== MIGRATION REPORT ===');
    console.log(`Total Processed: ${result.totalProcessed}`);
    console.log(`Migrated: ${result.migrated}`);
    console.log(`Errors: ${result.errors}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log('========================\n');

    if (result.details.length > 0) {
      console.log('Details:');
      result.details.forEach((detail, index) => {
        console.log(`${index + 1}. ${detail.oldInstanceName}:`);
        console.log(`   Status: ${detail.status}`);
        if (detail.newInstanceName) {
          console.log(`   New Name: ${detail.newInstanceName}`);
        }
        if (detail.userId) {
          console.log(`   User ID: ${detail.userId}`);
        }
        if (detail.error) {
          console.log(`   Error: ${detail.error}`);
        }
        console.log('');
      });
    }
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  const migrator = new WhatsAppInstanceMigrator();

  migrator.migrate()
    .then((result) => {
      migrator.printReport(result);

      if (result.errors > 0) {
        console.error('Migration completed with errors');
        process.exit(1);
      } else {
        console.log('Migration completed successfully');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { WhatsAppInstanceMigrator };