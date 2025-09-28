import { Queue, Worker, Job, QueueOptions, WorkerOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import {
  IncomingMessage,
  SendMessageParams,
  MessageResult
} from './providers/IWhatsAppProvider';

export interface QueueMessageData {
  instanceId: string;
  businessId: string;
  type: 'incoming' | 'outgoing';
  message?: IncomingMessage;
  sendParams?: SendMessageParams;
  retryCount?: number;
  priority?: number;
  delay?: number;
  metadata?: Record<string, any>;
}

export interface QueueConfig {
  concurrency: number;
  rateLimiter: {
    max: number;
    duration: number;
  };
  defaultJobOptions: {
    removeOnComplete: number;
    removeOnFail: number;
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
  };
  stalledInterval: number;
  maxStalledCount: number;
}

export class MessageQueue {
  private incomingQueue: Queue;
  private outgoingQueue: Queue;
  private incomingWorker: Worker;
  private outgoingWorker: Worker;
  private redis: Redis;
  private config: QueueConfig;

  // Handlers
  private incomingMessageHandler?: (data: QueueMessageData) => Promise<void>;
  private outgoingMessageHandler?: (data: QueueMessageData) => Promise<MessageResult>;

  constructor(redis: Redis, config?: Partial<QueueConfig>) {
    this.redis = redis;
    this.config = {
      concurrency: 10,
      rateLimiter: {
        max: 100,
        duration: 60000 // 100 mensagens por minuto
      },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      },
      stalledInterval: 30000,
      maxStalledCount: 1,
      ...config
    };

    this.setupQueues();
    this.setupWorkers();

    logger.info('Message Queue initialized', {
      concurrency: this.config.concurrency,
      rateLimiter: this.config.rateLimiter
    });
  }

  private setupQueues(): void {
    const queueOptions: QueueOptions = {
      connection: this.redis,
      defaultJobOptions: this.config.defaultJobOptions
    };

    this.incomingQueue = new Queue('incoming-messages', queueOptions);
    this.outgoingQueue = new Queue('outgoing-messages', queueOptions);

    // Event listeners para as filas
    this.incomingQueue.on('completed' as any, (job) => {
      logger.debug(`Incoming message job completed: ${job.id}`);
    });

    this.incomingQueue.on('failed' as any, (job, err) => {
      logger.error(`Incoming message job failed: ${job?.id}`, err);
    });

    this.outgoingQueue.on('completed' as any, (job) => {
      logger.debug(`Outgoing message job completed: ${job.id}`);
    });

    this.outgoingQueue.on('failed' as any, (job, err) => {
      logger.error(`Outgoing message job failed: ${job?.id}`, err);
    });
  }

  private setupWorkers(): void {
    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: this.config.concurrency,
      limiter: this.config.rateLimiter,
      stalledInterval: this.config.stalledInterval,
      maxStalledCount: this.config.maxStalledCount
    };

    // Worker para mensagens recebidas
    this.incomingWorker = new Worker(
      'incoming-messages',
      async (job: Job<QueueMessageData>) => {
        return this.processIncomingMessage(job);
      },
      workerOptions
    );

    // Worker para mensagens enviadas
    this.outgoingWorker = new Worker(
      'outgoing-messages',
      async (job: Job<QueueMessageData>) => {
        return this.processOutgoingMessage(job);
      },
      workerOptions
    );

    // Event listeners para workers
    this.incomingWorker.on('completed', (job) => {
      logger.debug(`Incoming worker completed job: ${job.id}`);
    });

    this.incomingWorker.on('failed', (job, err) => {
      logger.error(`Incoming worker failed job: ${job?.id}`, err);
    });

    this.outgoingWorker.on('completed', (job) => {
      logger.debug(`Outgoing worker completed job: ${job.id}`);
    });

    this.outgoingWorker.on('failed', (job, err) => {
      logger.error(`Outgoing worker failed job: ${job?.id}`, err);
    });
  }

  // Public Methods

  public async addIncomingMessage(data: QueueMessageData): Promise<Job<QueueMessageData>> {
    try {
      const job = await this.incomingQueue.add(
        'process-incoming',
        { ...data, type: 'incoming' },
        {
          priority: data.priority || 1,
          delay: data.delay || 0,
          attempts: this.config.defaultJobOptions.attempts,
          removeOnComplete: this.config.defaultJobOptions.removeOnComplete,
          removeOnFail: this.config.defaultJobOptions.removeOnFail
        }
      );

      logger.debug(`Incoming message added to queue: ${job.id}`, {
        instanceId: data.instanceId,
        messageId: data.message?.id
      });

      return job;
    } catch (error: any) {
      logger.error('Failed to add incoming message to queue:', error);
      throw error;
    }
  }

  public async addOutgoingMessage(data: QueueMessageData): Promise<Job<QueueMessageData>> {
    try {
      const job = await this.outgoingQueue.add(
        'process-outgoing',
        { ...data, type: 'outgoing' },
        {
          priority: data.priority || 1,
          delay: data.delay || 0,
          attempts: this.config.defaultJobOptions.attempts,
          removeOnComplete: this.config.defaultJobOptions.removeOnComplete,
          removeOnFail: this.config.defaultJobOptions.removeOnFail
        }
      );

      logger.debug(`Outgoing message added to queue: ${job.id}`, {
        instanceId: data.instanceId,
        to: data.sendParams?.to
      });

      return job;
    } catch (error: any) {
      logger.error('Failed to add outgoing message to queue:', error);
      throw error;
    }
  }

  public async scheduleMessage(data: QueueMessageData, delayMs: number): Promise<Job<QueueMessageData>> {
    return this.addOutgoingMessage({
      ...data,
      delay: delayMs,
      metadata: {
        ...data.metadata,
        scheduled: true,
        scheduledFor: new Date(Date.now() + delayMs)
      }
    });
  }

  public async addBulkMessages(messages: QueueMessageData[]): Promise<Job<QueueMessageData>[]> {
    try {
      const jobs = messages.map(msg => ({
        name: msg.type === 'incoming' ? 'process-incoming' : 'process-outgoing',
        data: msg,
        opts: {
          priority: msg.priority || 1,
          delay: msg.delay || 0
        }
      }));

      const queue = messages[0]?.type === 'incoming' ? this.incomingQueue : this.outgoingQueue;
      const createdJobs = await queue.addBulk(jobs);

      logger.info(`Added ${createdJobs.length} messages to ${messages[0]?.type} queue`);
      return createdJobs;
    } catch (error: any) {
      logger.error('Failed to add bulk messages to queue:', error);
      throw error;
    }
  }

  // Handler Registration

  public onIncomingMessage(handler: (data: QueueMessageData) => Promise<void>): void {
    this.incomingMessageHandler = handler;
    logger.debug('Incoming message handler registered');
  }

  public onOutgoingMessage(handler: (data: QueueMessageData) => Promise<MessageResult>): void {
    this.outgoingMessageHandler = handler;
    logger.debug('Outgoing message handler registered');
  }

  // Job Processing

  private async processIncomingMessage(job: Job<QueueMessageData>): Promise<void> {
    const { data } = job;

    logger.debug(`Processing incoming message job: ${job.id}`, {
      instanceId: data.instanceId,
      messageId: data.message?.id,
      attempt: job.attemptsMade + 1
    });

    if (!this.incomingMessageHandler) {
      throw new Error('No incoming message handler registered');
    }

    try {
      await this.incomingMessageHandler(data);
      logger.debug(`Incoming message processed successfully: ${job.id}`);
    } catch (error: any) {
      logger.error(`Failed to process incoming message: ${job.id}`, error);
      throw error;
    }
  }

  private async processOutgoingMessage(job: Job<QueueMessageData>): Promise<MessageResult> {
    const { data } = job;

    logger.debug(`Processing outgoing message job: ${job.id}`, {
      instanceId: data.instanceId,
      to: data.sendParams?.to,
      attempt: job.attemptsMade + 1
    });

    if (!this.outgoingMessageHandler) {
      throw new Error('No outgoing message handler registered');
    }

    try {
      const result = await this.outgoingMessageHandler(data);
      logger.debug(`Outgoing message processed successfully: ${job.id}`, {
        messageId: result.id,
        status: result.status
      });
      return result;
    } catch (error: any) {
      logger.error(`Failed to process outgoing message: ${job.id}`, error);
      throw error;
    }
  }

  // Queue Management

  public async pauseQueues(): Promise<void> {
    await Promise.all([
      this.incomingQueue.pause(),
      this.outgoingQueue.pause()
    ]);
    logger.info('All queues paused');
  }

  public async resumeQueues(): Promise<void> {
    await Promise.all([
      this.incomingQueue.resume(),
      this.outgoingQueue.resume()
    ]);
    logger.info('All queues resumed');
  }

  public async clearQueues(): Promise<void> {
    await Promise.all([
      this.incomingQueue.drain(),
      this.outgoingQueue.drain()
    ]);
    logger.info('All queues cleared');
  }

  public async getQueueStats(): Promise<any> {
    const [incomingStats, outgoingStats] = await Promise.all([
      this.getQueueStatus(this.incomingQueue),
      this.getQueueStatus(this.outgoingQueue)
    ]);

    return {
      incoming: incomingStats,
      outgoing: outgoingStats,
      workers: {
        incoming: {
          isRunning: !this.incomingWorker.isPaused(),
          concurrency: this.config.concurrency
        },
        outgoing: {
          isRunning: !this.outgoingWorker.isPaused(),
          concurrency: this.config.concurrency
        }
      }
    };
  }

  private async getQueueStatus(queue: Queue): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
      queue.getDelayed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      delayed: delayed.length,
      total: waiting.length + active.length + completed.length + failed.length + delayed.length
    };
  }

  // Rate Limiting

  public async updateRateLimit(max: number, duration: number): Promise<void> {
    this.config.rateLimiter = { max, duration };

    // Recria os workers com novo rate limit
    await this.dispose();
    this.setupWorkers();

    logger.info('Rate limit updated', { max, duration });
  }

  // Cleanup

  public async dispose(): Promise<void> {
    logger.info('Disposing Message Queue');

    // Parar workers
    await Promise.all([
      this.incomingWorker.close(),
      this.outgoingWorker.close()
    ]);

    // Fechar filas
    await Promise.all([
      this.incomingQueue.close(),
      this.outgoingQueue.close()
    ]);

    logger.info('Message Queue disposed');
  }

  // Retry Management

  public async retryFailedJobs(queueName: 'incoming' | 'outgoing'): Promise<number> {
    const queue = queueName === 'incoming' ? this.incomingQueue : this.outgoingQueue;
    const failedJobs = await queue.getFailed();

    let retryCount = 0;
    for (const job of failedJobs) {
      try {
        await job.retry();
        retryCount++;
      } catch (error: any) {
        logger.error(`Failed to retry job ${job.id}:`, error);
      }
    }

    logger.info(`Retried ${retryCount} failed jobs in ${queueName} queue`);
    return retryCount;
  }

  public async removeFailedJobs(queueName: 'incoming' | 'outgoing'): Promise<number> {
    const queue = queueName === 'incoming' ? this.incomingQueue : this.outgoingQueue;
    const failedJobs = await queue.getFailed();

    let removeCount = 0;
    for (const job of failedJobs) {
      try {
        await job.remove();
        removeCount++;
      } catch (error: any) {
        logger.error(`Failed to remove job ${job.id}:`, error);
      }
    }

    logger.info(`Removed ${removeCount} failed jobs from ${queueName} queue`);
    return removeCount;
  }
}