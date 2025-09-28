import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnhancedLogger } from './logger';
import { MetricsCollector } from './metrics';
import promClient from 'prom-client';

/**
 * Supabase Database Performance Monitoring
 * Monitors query performance, connection health, and database metrics
 */

// Supabase-specific metrics
export const supabaseQueryDuration = new promClient.Histogram({
  name: 'auzap_supabase_query_duration_seconds',
  help: 'Supabase query execution time',
  labelNames: ['table', 'operation', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

export const supabaseConnectionHealth = new promClient.Gauge({
  name: 'auzap_supabase_connection_health',
  help: 'Supabase connection health status (1 = healthy, 0 = unhealthy)'
});

export const supabaseRowsAffected = new promClient.Counter({
  name: 'auzap_supabase_rows_affected_total',
  help: 'Total rows affected by Supabase operations',
  labelNames: ['table', 'operation']
});

export const supabaseErrors = new promClient.Counter({
  name: 'auzap_supabase_errors_total',
  help: 'Supabase operation errors',
  labelNames: ['table', 'operation', 'error_code']
});

export const supabaseRealtimeConnections = new promClient.Gauge({
  name: 'auzap_supabase_realtime_connections',
  help: 'Active Supabase realtime connections',
  labelNames: ['channel']
});

export const supabaseStorageOperations = new promClient.Counter({
  name: 'auzap_supabase_storage_operations_total',
  help: 'Supabase storage operations',
  labelNames: ['bucket', 'operation', 'status']
});

export const supabaseAuthOperations = new promClient.Counter({
  name: 'auzap_supabase_auth_operations_total',
  help: 'Supabase authentication operations',
  labelNames: ['operation', 'provider', 'status']
});

export const supabaseRpcCalls = new promClient.Counter({
  name: 'auzap_supabase_rpc_calls_total',
  help: 'Supabase RPC function calls',
  labelNames: ['function_name', 'status']
});

/**
 * Enhanced Supabase Client with Monitoring
 */
export class MonitoredSupabaseClient {
  private client: SupabaseClient;
  private logger: EnhancedLogger;
  private metricsCollector: MetricsCollector;
  private connectionHealthInterval?: NodeJS.Timeout;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    logger: EnhancedLogger,
    metricsCollector: MetricsCollector
  ) {
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

    this.logger = logger.child({ component: 'supabase-monitor' });
    this.metricsCollector = metricsCollector;

    this.startConnectionHealthMonitoring();
    this.setupEventListeners();
  }

  /**
   * Monitored database operations
   */
  async select(table: string, query?: any): Promise<any> {
    const startTime = Date.now();
    const operation = 'select';

    try {
      this.logger.debug(`Starting ${operation} operation on ${table}`, { query });

      let queryBuilder = this.client.from(table).select();

      if (query) {
        Object.keys(query).forEach(key => {
          if (query[key] !== undefined) {
            queryBuilder = queryBuilder.eq(key, query[key]);
          }
        });
      }

      const { data, error, count } = await queryBuilder;
      const duration = Date.now() - startTime;

      if (error) {
        this.recordError(table, operation, error, duration);
        throw error;
      }

      this.recordSuccess(table, operation, duration, data?.length || 0);
      return { data, count };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError(table, operation, error, duration);
      throw error;
    }
  }

  async insert(table: string, data: any): Promise<any> {
    const startTime = Date.now();
    const operation = 'insert';

    try {
      this.logger.debug(`Starting ${operation} operation on ${table}`, { recordCount: Array.isArray(data) ? data.length : 1 });

      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select();

      const duration = Date.now() - startTime;

      if (error) {
        this.recordError(table, operation, error, duration);
        throw error;
      }

      const rowsAffected = Array.isArray(result) ? result.length : (result ? 1 : 0);
      this.recordSuccess(table, operation, duration, rowsAffected);
      return { data: result };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError(table, operation, error, duration);
      throw error;
    }
  }

  async update(table: string, data: any, filter: any): Promise<any> {
    const startTime = Date.now();
    const operation = 'update';

    try {
      this.logger.debug(`Starting ${operation} operation on ${table}`, { filter });

      let queryBuilder = this.client.from(table).update(data);

      Object.keys(filter).forEach(key => {
        if (filter[key] !== undefined) {
          queryBuilder = queryBuilder.eq(key, filter[key]);
        }
      });

      const { data: result, error } = await queryBuilder.select();
      const duration = Date.now() - startTime;

      if (error) {
        this.recordError(table, operation, error, duration);
        throw error;
      }

      const rowsAffected = Array.isArray(result) ? result.length : (result ? 1 : 0);
      this.recordSuccess(table, operation, duration, rowsAffected);
      return { data: result };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError(table, operation, error, duration);
      throw error;
    }
  }

  async delete(table: string, filter: any): Promise<any> {
    const startTime = Date.now();
    const operation = 'delete';

    try {
      this.logger.debug(`Starting ${operation} operation on ${table}`, { filter });

      let queryBuilder = this.client.from(table).delete();

      Object.keys(filter).forEach(key => {
        if (filter[key] !== undefined) {
          queryBuilder = queryBuilder.eq(key, filter[key]);
        }
      });

      const { data: result, error } = await queryBuilder.select();
      const duration = Date.now() - startTime;

      if (error) {
        this.recordError(table, operation, error, duration);
        throw error;
      }

      const rowsAffected = Array.isArray(result) ? result.length : (result ? 1 : 0);
      this.recordSuccess(table, operation, duration, rowsAffected);
      return { data: result };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordError(table, operation, error, duration);
      throw error;
    }
  }

  /**
   * Monitored RPC function calls
   */
  async rpc(functionName: string, params?: any): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Calling RPC function: ${functionName}`, { params });

      const { data, error } = await this.client.rpc(functionName, params);
      const duration = Date.now() - startTime;

      if (error) {
        supabaseRpcCalls.labels(functionName, 'error').inc();
        this.logger.error(`RPC function ${functionName} failed`, error, { duration, params });
        throw error;
      }

      supabaseRpcCalls.labels(functionName, 'success').inc();
      this.logger.info(`RPC function ${functionName} completed`, { duration, resultCount: Array.isArray(data) ? data.length : 1 });

      return { data };

    } catch (error) {
      const duration = Date.now() - startTime;
      supabaseRpcCalls.labels(functionName, 'error').inc();
      this.logger.error(`RPC function ${functionName} error`, error, { duration });
      throw error;
    }
  }

  /**
   * Monitored authentication operations
   */
  async signUp(email: string, password: string, options?: any): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.info('User signup attempt', { email });

      const { data, error } = await this.client.auth.signUp({
        email,
        password,
        ...options
      });

      const duration = Date.now() - startTime;

      if (error) {
        supabaseAuthOperations.labels('signup', 'email', 'error').inc();
        this.logger.warn('User signup failed', { email, error: error.message, duration });
        throw error;
      }

      supabaseAuthOperations.labels('signup', 'email', 'success').inc();
      this.logger.info('User signup successful', { email, userId: data.user?.id, duration });

      return { data };

    } catch (error) {
      supabaseAuthOperations.labels('signup', 'email', 'error').inc();
      this.logger.error('User signup error', error, { email });
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.info('User signin attempt', { email });

      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      const duration = Date.now() - startTime;

      if (error) {
        supabaseAuthOperations.labels('signin', 'email', 'error').inc();
        this.logger.warn('User signin failed', { email, error: error.message, duration });
        throw error;
      }

      supabaseAuthOperations.labels('signin', 'email', 'success').inc();
      this.logger.info('User signin successful', { email, userId: data.user?.id, duration });

      return { data };

    } catch (error) {
      supabaseAuthOperations.labels('signin', 'email', 'error').inc();
      this.logger.error('User signin error', error, { email });
      throw error;
    }
  }

  /**
   * Monitored storage operations
   */
  async uploadFile(bucket: string, path: string, file: any): Promise<any> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Uploading file to storage`, { bucket, path });

      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file);

      const duration = Date.now() - startTime;

      if (error) {
        supabaseStorageOperations.labels(bucket, 'upload', 'error').inc();
        this.logger.error('File upload failed', error, { bucket, path, duration });
        throw error;
      }

      supabaseStorageOperations.labels(bucket, 'upload', 'success').inc();
      this.logger.info('File upload successful', { bucket, path, duration });

      return { data };

    } catch (error) {
      supabaseStorageOperations.labels(bucket, 'upload', 'error').inc();
      this.logger.error('File upload error', error, { bucket, path });
      throw error;
    }
  }

  /**
   * Realtime subscription monitoring
   */
  subscribeToChanges(table: string, callback: (payload: any) => void) {
    const channel = this.client
      .channel(`${table}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          this.logger.info('Realtime change received', { table, event: payload.eventType });
          callback(payload);
        }
      )
      .subscribe((status) => {
        this.logger.info('Realtime subscription status', { table, status });

        if (status === 'SUBSCRIBED') {
          supabaseRealtimeConnections.labels(`${table}_changes`).inc();
        } else if (status === 'CLOSED') {
          supabaseRealtimeConnections.labels(`${table}_changes`).dec();
        }
      });

    return channel;
  }

  /**
   * Private methods for metrics recording
   */
  private recordSuccess(table: string, operation: string, duration: number, rowsAffected: number) {
    supabaseQueryDuration.labels(table, operation, 'success').observe(duration / 1000);
    supabaseRowsAffected.labels(table, operation).inc(rowsAffected);

    this.logger.info('Supabase operation completed', {
      table,
      operation,
      duration,
      rowsAffected,
      status: 'success'
    });

    // Log slow queries
    if (duration > 1000) {
      this.logger.warn('Slow Supabase query detected', {
        table,
        operation,
        duration,
        threshold: 1000
      });
    }
  }

  private recordError(table: string, operation: string, error: any, duration: number) {
    const errorCode = error?.code || 'unknown';

    supabaseQueryDuration.labels(table, operation, 'error').observe(duration / 1000);
    supabaseErrors.labels(table, operation, errorCode).inc();

    this.logger.error('Supabase operation failed', error, {
      table,
      operation,
      duration,
      errorCode,
      status: 'error'
    });

    this.metricsCollector.recordError('supabase_operation', 'database', 'high', error);
  }

  /**
   * Connection health monitoring
   */
  private startConnectionHealthMonitoring() {
    this.connectionHealthInterval = setInterval(async () => {
      try {
        // Simple health check query
        await this.client.from('health_check').select('1').limit(1);
        supabaseConnectionHealth.set(1);

        this.logger.debug('Supabase connection health check passed');
      } catch (error) {
        supabaseConnectionHealth.set(0);

        this.logger.error('Supabase connection health check failed', error);
        this.metricsCollector.recordError('supabase_connection', 'database', 'critical', error);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners() {
    // Listen for auth state changes
    this.client.auth.onAuthStateChange((event, session) => {
      this.logger.info('Auth state change', { event, userId: session?.user?.id });

      if (event === 'SIGNED_IN') {
        supabaseAuthOperations.labels('state_change', 'session', 'signed_in').inc();
      } else if (event === 'SIGNED_OUT') {
        supabaseAuthOperations.labels('state_change', 'session', 'signed_out').inc();
      }
    });
  }

  /**
   * Get database performance statistics
   */
  async getPerformanceStats(): Promise<any> {
    try {
      // Query recent performance metrics from Supabase
      const stats = {
        connectionHealth: supabaseConnectionHealth.get(),
        totalQueries: await promClient.register.getSingleMetricAsString('auzap_supabase_query_duration_seconds_count'),
        errorRate: await this.calculateErrorRate(),
        avgResponseTime: await this.calculateAvgResponseTime(),
        slowQueries: await this.getSlowQueries()
      };

      return stats;
    } catch (error) {
      this.logger.error('Failed to get performance stats', error);
      throw error;
    }
  }

  private async calculateErrorRate(): Promise<number> {
    // Implementation would calculate error rate from metrics
    return 0; // Placeholder
  }

  private async calculateAvgResponseTime(): Promise<number> {
    // Implementation would calculate average response time
    return 0; // Placeholder
  }

  private async getSlowQueries(): Promise<any[]> {
    // Implementation would return slow query information
    return []; // Placeholder
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.connectionHealthInterval) {
      clearInterval(this.connectionHealthInterval);
    }
  }

  // Expose the original client for direct access when needed
  get originalClient(): SupabaseClient {
    return this.client;
  }
}

export default MonitoredSupabaseClient;