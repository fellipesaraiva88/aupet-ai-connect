import dotenv from 'dotenv';

// Carregar environment variables PRIMEIRO
dotenv.config();

import { z } from 'zod';
import { logger } from '../utils/logger';

// ===================================================================
// SCHEMA DE VALIDAÇÃO PARA VARIÁVEIS DE AMBIENTE
// OBJETIVO: Garantir que todas as variáveis críticas estão configuradas
// ===================================================================

const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('3001'),
  FRONTEND_URL: z.string().url(),

  // Supabase Configuration (REQUIRED)
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(50),
  SUPABASE_SERVICE_KEY: z.string().min(50).optional(),

  // Evolution API Configuration (REQUIRED)
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string().min(20),

  // OpenAI Configuration (OPTIONAL mas recomendado)
  OPENAI_API_KEY: z.string().min(20).optional(),

  // JWT Configuration (REQUIRED)
  JWT_SECRET: z.string().min(32).refine(
    (val) => val !== 'dev-jwt-secret-change-in-production' && val !== 'default-secret',
    { message: 'JWT Secret padrão não é permitido em produção' }
  ),
  JWT_EXPIRE_TIME: z.string().default('24h'),

  // API Key for Authentication (REQUIRED)
  API_KEY: z.string().min(16).refine(
    (val) => val !== 'dev-api-key',
    { message: 'API Key padrão não é permitido em produção' }
  ),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().regex(/^\d+$/).transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().regex(/^\d+$/).transform(Number).default('900000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Health Check
  HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+$/).transform(Number).default('30000'),

  // Webhook Configuration
  WEBHOOK_URL: z.string().url(),

  // Redis Configuration (OPTIONAL)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // Database Configuration (OPTIONAL - para backup direto)
  DATABASE_URL: z.string().optional(),

  // Security Configuration
  ENCRYPTION_KEY: z.string().min(32).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

// ===================================================================
// VALIDADOR DE ENVIRONMENT
// ===================================================================
export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private config: EnvConfig;

  private constructor() {
    this.config = this.validateAndParse();
  }

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  private validateAndParse(): EnvConfig {
    try {
      // Validar environment variables
      const result = envSchema.parse(process.env);

      // Verificações especiais para produção
      if (result.NODE_ENV === 'production') {
        this.validateProductionRequirements(result);
      }

      logger.info('Environment variables validated successfully', {
        nodeEnv: result.NODE_ENV,
        port: result.PORT,
        hasSupabaseService: !!result.SUPABASE_SERVICE_KEY,
        hasOpenAI: !!result.OPENAI_API_KEY,
        hasRedis: !!result.REDIS_URL
      });

      return result;

    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err =>
          `${err.path.join('.')}: ${err.message}`
        ).join('\n');

        logger.error('Environment validation failed:', {
          errors: errorMessages,
          provided: Object.keys(process.env).filter(key =>
            key.startsWith('SUPABASE_') ||
            key.startsWith('EVOLUTION_') ||
            key.startsWith('JWT_') ||
            key.startsWith('API_')
          )
        });

        throw new Error(`Environment validation failed:\n${errorMessages}`);
      }

      throw error;
    }
  }

  private validateProductionRequirements(config: EnvConfig): void {
    const productionErrors: string[] = [];

    // Verificar se não está usando valores padrão perigosos
    if (!config.SUPABASE_SERVICE_KEY) {
      productionErrors.push('SUPABASE_SERVICE_KEY é obrigatório em produção');
    }

    if (!config.OPENAI_API_KEY) {
      logger.warn('OPENAI_API_KEY não configurado - recursos de AI limitados');
    }

    if (!config.REDIS_URL && !config.REDIS_HOST) {
      logger.warn('Redis não configurado - performance pode ser impactada');
    }

    if (!config.ENCRYPTION_KEY) {
      productionErrors.push('ENCRYPTION_KEY é obrigatório em produção');
    }

    if (!config.SESSION_SECRET) {
      productionErrors.push('SESSION_SECRET é obrigatório em produção');
    }

    // Verificar força das chaves
    if (config.JWT_SECRET.length < 64) {
      productionErrors.push('JWT_SECRET deve ter pelo menos 64 caracteres em produção');
    }

    if (config.API_KEY.length < 32) {
      productionErrors.push('API_KEY deve ter pelo menos 32 caracteres em produção');
    }

    if (productionErrors.length > 0) {
      throw new Error(`Configurações de produção inválidas:\n${productionErrors.join('\n')}`);
    }
  }

  public getConfig(): EnvConfig {
    return this.config;
  }

  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  // ===================================================================
  // MÉTODOS UTILITÁRIOS
  // ===================================================================

  public maskSecret(secret: string): string {
    if (!secret || secret.length < 8) return '***';
    return secret.substring(0, 4) + '*'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  }

  public logConfigStatus(): void {
    const config = this.getConfig();

    logger.info('Configuration Status:', {
      environment: config.NODE_ENV,
      port: config.PORT,
      supabaseUrl: config.SUPABASE_URL,
      supabaseAnonKey: this.maskSecret(config.SUPABASE_ANON_KEY),
      supabaseServiceKey: config.SUPABASE_SERVICE_KEY ? this.maskSecret(config.SUPABASE_SERVICE_KEY) : 'NOT_SET',
      evolutionApiUrl: config.EVOLUTION_API_URL,
      evolutionApiKey: this.maskSecret(config.EVOLUTION_API_KEY),
      openaiApiKey: config.OPENAI_API_KEY ? this.maskSecret(config.OPENAI_API_KEY) : 'NOT_SET',
      jwtSecret: this.maskSecret(config.JWT_SECRET),
      apiKey: this.maskSecret(config.API_KEY),
      webhookUrl: config.WEBHOOK_URL,
      redisConfigured: !!(config.REDIS_URL || config.REDIS_HOST),
      encryptionKey: config.ENCRYPTION_KEY ? 'SET' : 'NOT_SET',
      sessionSecret: config.SESSION_SECRET ? 'SET' : 'NOT_SET'
    });
  }
}

// ===================================================================
// FACTORY FUNCTION
// ===================================================================
export const getEnvConfig = (): EnvConfig => {
  return EnvironmentValidator.getInstance().getConfig();
};

export const envValidator = EnvironmentValidator.getInstance();