import { Queue } from 'bullmq';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';
export declare class OrchestratorService {
    private readonly executionQueue;
    private readonly logger;
    constructor(executionQueue: Queue);
    addIntentToQueue(intent: CreateIntentDto): Promise<import("bullmq").Job<any, any, string>>;
}
