import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    @InjectQueue('execution') private readonly executionQueue: Queue,
    @InjectQueue('rebalance') private readonly rebalanceQueue: Queue
  ) {}

  async addIntentToQueue(intent: CreateIntentDto, delay: number = 0) {
    this.logger.log(`Enqueuing intent for user: ${intent.userId} (Delay: ${delay}ms)`);
    
    const job = await this.executionQueue.add('execute-swap', intent, {
      attempts: 3,
      delay, // Add the delay here
      backoff: {
        type: 'exponential',
        delay: 5000, // Increase base backoff to 5s for rate limit recovery
      },
      removeOnComplete: true,
    });

    this.logger.log(`Job added to execution queue with ID: ${job.id}`);
    return job;
  }

  async addRebalanceToQueue(rebalanceIntentId: string, telegramId: string, messageId?: number) {
    this.logger.log(`Enqueuing rebalance intent: ${rebalanceIntentId} for user: ${telegramId}`);
    
    const job = await this.rebalanceQueue.add('plan-rebalance', {
      rebalanceIntentId,
      telegramId,
      messageId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
    });

    this.logger.log(`Job added to rebalance queue with ID: ${job.id}`);
    return job;
  }
}
