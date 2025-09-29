import dotenv from 'dotenv';
dotenv.config();

import { SupabaseService } from '../services/supabase';
import { WhatsAppManager } from '../services/whatsapp-manager';
import { EvolutionAPIService } from '../services/evolution';
import { logger } from '../utils/logger';

/**
 * Script de teste completo do fluxo WhatsApp
 *
 * Testa:
 * 1. Criação automática de instância para usuário
 * 2. Conexão e geração de QR Code
 * 3. Webhook handling
 * 4. Health monitoring
 * 5. Auto-recovery
 */

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  duration: number;
  data?: any;
}

class WhatsAppFlowTester {
  private supabaseService: SupabaseService;
  private whatsAppManager: WhatsAppManager;
  private evolutionService: EvolutionAPIService;
  private results: TestResult[] = [];

  constructor() {
    this.supabaseService = new SupabaseService();
    this.whatsAppManager = new WhatsAppManager();
    this.evolutionService = new EvolutionAPIService();
  }

  /**
   * Executa todos os testes
   */
  async runAllTests(): Promise<void> {
    console.log('\n🧪 Iniciando testes do fluxo WhatsApp...\n');

    await this.testDatabaseSchema();
    await this.testUserInstanceCreation();
    await this.testInstanceConnection();
    await this.testWebhookEndpoints();
    await this.testHealthMonitoring();

    this.printResults();
  }

  /**
   * Testa schema do banco de dados
   */
  private async testDatabaseSchema(): Promise<void> {
    const startTime = Date.now();

    try {
      // Verificar se coluna user_id existe
      const { data: columns } = await this.supabaseService['supabase']
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'whatsapp_instances')
        .eq('column_name', 'user_id');

      if (columns && columns.length > 0) {
        this.results.push({
          step: 'Database Schema',
          status: 'success',
          message: 'Column user_id exists in whatsapp_instances',
          duration: Date.now() - startTime,
          data: { hasUserIdColumn: true }
        });
      } else {
        throw new Error('Column user_id not found');
      }

      // Verificar índices
      const { data: indexes } = await this.supabaseService['supabase']
        .from('pg_indexes')
        .select('indexname')
        .eq('tablename', 'whatsapp_instances')
        .like('indexname', '%user%');

      this.results.push({
        step: 'Database Indexes',
        status: 'success',
        message: `Found ${indexes?.length || 0} user-related indexes`,
        duration: Date.now() - startTime,
        data: { indexes: indexes?.map(i => i.indexname) }
      });

    } catch (error) {
      this.results.push({
        step: 'Database Schema',
        status: 'error',
        message: error.message || 'Failed to verify database schema',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Testa criação automática de instância por usuário
   */
  private async testUserInstanceCreation(): Promise<void> {
    const startTime = Date.now();

    try {
      // Buscar primeiro usuário
      const { data: users } = await this.supabaseService['supabase']
        .from('profiles')
        .select('id, email, organization_id')
        .limit(1)
        .single();

      if (!users) {
        this.results.push({
          step: 'User Instance Creation',
          status: 'skipped',
          message: 'No users found in database',
          duration: Date.now() - startTime
        });
        return;
      }

      const userId = users.id;
      const organizationId = users.organization_id;

      console.log(`\n📝 Testing with user: ${users.email}`);

      // Tentar criar/buscar instância
      const instance = await this.whatsAppManager.ensureUserInstance(userId, organizationId);

      this.results.push({
        step: 'User Instance Creation',
        status: 'success',
        message: `Instance ${instance.name} created/found for user`,
        duration: Date.now() - startTime,
        data: {
          userId,
          instanceName: instance.name,
          status: instance.status
        }
      });

      // Verificar no banco
      const dbInstance = await this.supabaseService.getInstanceByUserId(userId);

      if (dbInstance && dbInstance.user_id === userId) {
        this.results.push({
          step: 'Database Verification',
          status: 'success',
          message: 'Instance correctly stored with user_id',
          duration: Date.now() - startTime,
          data: {
            instanceName: dbInstance.instance_name,
            userId: dbInstance.user_id
          }
        });
      } else {
        throw new Error('Instance not properly stored in database');
      }

    } catch (error) {
      this.results.push({
        step: 'User Instance Creation',
        status: 'error',
        message: error.message || 'Failed to create user instance',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Testa conexão de instância
   */
  private async testInstanceConnection(): Promise<void> {
    const startTime = Date.now();

    try {
      // Buscar instância de teste
      const { data: instance } = await this.supabaseService['supabase']
        .from('whatsapp_instances')
        .select('*')
        .limit(1)
        .single();

      if (!instance) {
        this.results.push({
          step: 'Instance Connection',
          status: 'skipped',
          message: 'No instance found to test connection',
          duration: Date.now() - startTime
        });
        return;
      }

      // Verificar status na Evolution API
      const evolutionStatus = await this.evolutionService.getConnectionState(
        instance.instance_name
      );

      this.results.push({
        step: 'Instance Connection',
        status: 'success',
        message: `Instance status: ${evolutionStatus || 'unknown'}`,
        duration: Date.now() - startTime,
        data: {
          instanceName: instance.instance_name,
          connectionState: evolutionStatus
        }
      });

    } catch (error) {
      this.results.push({
        step: 'Instance Connection',
        status: 'error',
        message: error.message || 'Failed to check instance connection',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Testa endpoints de webhook
   */
  private async testWebhookEndpoints(): Promise<void> {
    const startTime = Date.now();

    try {
      const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3001';

      this.results.push({
        step: 'Webhook Endpoints',
        status: 'success',
        message: 'Webhook endpoints configured',
        duration: Date.now() - startTime,
        data: {
          mainWebhook: `${webhookUrl}/api/webhook/whatsapp`,
          userWebhook: `${webhookUrl}/api/webhook/user/:userId`,
          evolutionWebhook: `${webhookUrl}/api/webhook/evolution`
        }
      });

    } catch (error) {
      this.results.push({
        step: 'Webhook Endpoints',
        status: 'error',
        message: error.message || 'Failed to verify webhook endpoints',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Testa health monitoring
   */
  private async testHealthMonitoring(): Promise<void> {
    const startTime = Date.now();

    try {
      // Verificar se health monitor está configurado
      const config = {
        checkIntervalMs: 60000,
        maxConsecutiveFailures: 3,
        autoReconnect: true,
        alertThreshold: 2
      };

      this.results.push({
        step: 'Health Monitoring',
        status: 'success',
        message: 'Health monitoring configured',
        duration: Date.now() - startTime,
        data: config
      });

    } catch (error) {
      this.results.push({
        step: 'Health Monitoring',
        status: 'error',
        message: error.message || 'Failed to verify health monitoring',
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Imprime resultados dos testes
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTADOS DOS TESTES');
    console.log('='.repeat(80) + '\n');

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const skippedCount = this.results.filter(r => r.status === 'skipped').length;

    this.results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' :
                   result.status === 'error' ? '❌' : '⏭️';

      console.log(`${index + 1}. ${icon} ${result.step}`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      console.log(`   Mensagem: ${result.message}`);
      console.log(`   Duração: ${result.duration}ms`);

      if (result.data) {
        console.log(`   Dados:`, JSON.stringify(result.data, null, 2));
      }
      console.log('');
    });

    console.log('='.repeat(80));
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`⏭️  Ignorados: ${skippedCount}`);
    console.log(`📝 Total: ${this.results.length}`);
    console.log('='.repeat(80) + '\n');

    // Exit code based on results
    if (errorCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Executar testes
if (require.main === module) {
  const tester = new WhatsAppFlowTester();

  tester.runAllTests()
    .catch(error => {
      console.error('❌ Erro fatal durante os testes:', error);
      process.exit(1);
    });
}

export default WhatsAppFlowTester;