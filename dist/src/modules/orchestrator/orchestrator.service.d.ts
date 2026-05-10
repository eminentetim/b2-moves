import { Queue } from 'bullmq';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';
export declare class OrchestratorService {
    private readonly executionQueue;
    private readonly rebalanceQueue;
    private readonly logger;
    constructor(executionQueue: Queue, rebalanceQueue: Queue);
    addIntentToQueue(intent: CreateIntentDto, delay?: number): Promise<import("bullmq").Job<any, any, string>>;
    addRebalanceToQueue(rebalanceIntentId: string, telegramId: string, messageId?: number): Promise<import("bullmq").Job<any, any, string>>;
}
