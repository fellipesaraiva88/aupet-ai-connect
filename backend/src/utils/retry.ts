import { logger } from './logger';

export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  exponentialBackoff?: boolean;
  backoffMultiplier?: number;
  maxDelayMs?: number;
  retryableErrors?: string[];
  onRetry?: (error: Error, attempt: number) => void;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delayMs: 1000,
  exponentialBackoff: true,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  retryableErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ENETUNREACH',
    'ECONNRESET',
    'EHOSTUNREACH',
    'EPIPE',
    'EAI_AGAIN'
  ]
};

/**
 * Executa uma operação com retry automático
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context?: string
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt < opts.maxAttempts) {
    attempt++;

    try {
      const result = await operation();

      if (attempt > 1) {
        logger.info(`Operation succeeded after ${attempt} attempts`, { context });
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Verificar se o erro é retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        logger.warn(`Non-retryable error encountered`, {
          context,
          error: lastError.message,
          attempt
        });
        throw lastError;
      }

      // Se atingiu o limite de tentativas, lançar erro
      if (attempt >= opts.maxAttempts) {
        logger.error(`Operation failed after ${attempt} attempts`, {
          context,
          error: lastError.message
        });
        throw new Error(
          `Operation failed after ${attempt} attempts: ${lastError.message}`
        );
      }

      // Calcular delay antes da próxima tentativa
      const delay = calculateDelay(attempt, opts);

      logger.warn(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms`, {
        context,
        error: lastError.message,
        nextAttemptIn: delay
      });

      // Callback de retry se fornecido
      if (opts.onRetry) {
        try {
          opts.onRetry(lastError, attempt);
        } catch (callbackError) {
          logger.error('Error in retry callback:', callbackError);
        }
      }

      // Aguardar antes de tentar novamente
      await sleep(delay);
    }
  }

  // Nunca deve chegar aqui, mas TypeScript precisa
  throw lastError || new Error('Operation failed with unknown error');
}

/**
 * Verifica se um erro é retryable
 */
function isRetryableError(error: any, retryableErrors?: string[]): boolean {
  if (!retryableErrors || retryableErrors.length === 0) {
    // Se não há lista de erros retryable, assumir que todos são
    return true;
  }

  const errorCode = error?.code;
  const errorMessage = error?.message || '';

  // Verificar código de erro
  if (errorCode && retryableErrors.includes(errorCode)) {
    return true;
  }

  // Verificar mensagem de erro
  return retryableErrors.some(pattern =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Calcula o delay para a próxima tentativa
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  let delay = options.delayMs;

  if (options.exponentialBackoff) {
    // Backoff exponencial: delay * (backoffMultiplier ^ (attempt - 1))
    const multiplier = options.backoffMultiplier || 2;
    delay = options.delayMs * Math.pow(multiplier, attempt - 1);
  }

  // Aplicar limite máximo
  if (options.maxDelayMs && delay > options.maxDelayMs) {
    delay = options.maxDelayMs;
  }

  return delay;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry específico para operações HTTP
 */
export async function retryHttp<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  return retry(operation, {
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    retryableErrors: [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ENETUNREACH',
      'ECONNRESET',
      '502',
      '503',
      '504',
      'timeout',
      'network'
    ]
  }, context);
}

/**
 * Retry específico para operações de banco de dados
 */
export async function retryDatabase<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  return retry(operation, {
    maxAttempts: 5,
    delayMs: 500,
    exponentialBackoff: true,
    backoffMultiplier: 1.5,
    maxDelayMs: 5000,
    retryableErrors: [
      'connection',
      'timeout',
      'deadlock',
      'lock',
      'PGRST',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ]
  }, context);
}

/**
 * Retry com circuit breaker
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minuto
    private resetTimeout: number = 30000 // 30 segundos
  ) {}

  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    // Verificar estado do circuito
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure < this.resetTimeout) {
        throw new Error(`Circuit breaker is OPEN for ${context || 'operation'}`);
      }

      // Tentar half-open
      this.state = 'half-open';
      logger.info(`Circuit breaker entering HALF-OPEN state for ${context}`);
    }

    try {
      const result = await operation();

      // Sucesso - resetar circuito
      if (this.state === 'half-open') {
        logger.info(`Circuit breaker CLOSED after successful operation for ${context}`);
      }

      this.reset();
      return result;

    } catch (error) {
      this.recordFailure();

      logger.error(`Circuit breaker recorded failure for ${context}`, {
        failures: this.failures,
        threshold: this.threshold,
        state: this.state
      });

      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.warn(`Circuit breaker OPENED after ${this.failures} failures`);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }
}

/**
 * Decorator para retry automático
 */
export function Retry(options: Partial<RetryOptions> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return retry(
        () => originalMethod.apply(this, args),
        options,
        `${target.constructor.name}.${propertyKey}`
      );
    };

    return descriptor;
  };
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

/**
 * Retry com timeout
 */
export async function retryWithTimeout<T>(
  operation: () => Promise<T>,
  retryOptions: Partial<RetryOptions> = {},
  timeoutMs: number = 30000,
  context?: string
): Promise<T> {
  return withTimeout(
    retry(operation, retryOptions, context),
    timeoutMs,
    `Operation timed out after ${timeoutMs}ms`
  );
}