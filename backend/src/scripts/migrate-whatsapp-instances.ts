import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

import { EvolutionAPIService } from '../services/evolution';
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
  private evolutionService: EvolutionAPIService;
  private supabaseService: SupabaseService;

  constructor() {
    this.evolutionService = new EvolutionAPIService();
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
      // First, verify if user exists in profiles
      const { data: profile } = await this.supabaseService['supabase']
        .from('profiles')
        .select('id, organization_id')
        .eq('id', userId)
        .single();

      const organizationId = profile?.organization_id || 'migrated';

      await this.supabaseService.createInstance({
        name: instanceName,
        user_id: userId,
        status: instance.status || instance.connectionStatus || 'created',
        organization_id: organizationId
      });

      logger.info(`Created database record for ${instanceName} with user_id: ${userId}`);
    } catch (error) {
      logger.error(`Error creating database record for ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza instâncias existentes com user_id
   */
  async updateExistingInstances(): Promise<MigrationResult> {
    const result: MigrationResult = {
      totalProcessed: 0,
      migrated: 0,
      errors: 0,
      skipped: 0,
      details: []
    };

    try {
      logger.info('Starting update of existing instances with user_id...');

      // Buscar todas as instâncias no banco sem user_id
      const { data: instances } = await this.supabaseService['supabase']
        .from('whatsapp_instances')
        .select('*')
        .is('user_id', null);

      if (!instances || instances.length === 0) {
        logger.info('No instances need user_id update');
        return result;
      }

      result.totalProcessed = instances.length;
      logger.info(`Found ${instances.length} instances without user_id`);

      for (const instance of instances) {
        try {
          const instanceName = instance.instance_name;

          // Extrair userId do instance_name
          const userIdMatch = instanceName.match(/^user_(.+)$/);

          if (!userIdMatch) {
            result.skipped++;
            result.details.push({
              oldInstanceName: instanceName,
              status: 'skipped',
              error: 'Instance name does not match user_[userId] format'
            });
            continue;
          }

          const userId = userIdMatch[1];

          // Verificar se usuário existe
          const { data: profile } = await this.supabaseService['supabase']
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .single();

          if (!profile) {
            result.errors++;
            result.details.push({
              oldInstanceName: instanceName,
              userId,
              status: 'error',
              error: 'User not found in profiles table'
            });
            continue;
          }

          // Atualizar user_id
          await this.supabaseService.updateInstanceUserId(instanceName, userId);

          result.migrated++;
          result.details.push({
            oldInstanceName: instanceName,
            userId,
            status: 'migrated'
          });

          logger.info(`Updated instance ${instanceName} with user_id: ${userId}`);
        } catch (error) {
          result.errors++;
          result.details.push({
            oldInstanceName: instance.instance_name,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          logger.error(`Error updating instance ${instance.instance_name}:`, error);
        }
      }

      logger.info('Update completed', {
        totalProcessed: result.totalProcessed,
        migrated: result.migrated,
        errors: result.errors,
        skipped: result.skipped
      });

      return result;
    } catch (error) {
      logger.error('Update failed:', error);
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
  const command = process.argv[2] || 'migrate';

  let migrationPromise: Promise<MigrationResult>;

  switch (command) {
    case 'update':
      console.log('Updating existing instances with user_id...\n');
      migrationPromise = migrator.updateExistingInstances();
      break;
    case 'migrate':
    default:
      console.log('Migrating instances from Evolution API...\n');
      migrationPromise = migrator.migrate();
      break;
  }

  migrationPromise
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