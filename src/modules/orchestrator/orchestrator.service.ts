import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(@InjectQueue('execution') private readonly executionQueue: Queue) {}

  async addIntentToQueue(intent: CreateIntentDto) {
    this.logger.log(`Enqueuing intent for user: ${intent.userId}`);
    
    const job = await this.executionQueue.add('execute-swap', intent, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
    });

    this.logger.log(`Job added to queue with ID: ${job.id}`);
    return job;
  }
}
