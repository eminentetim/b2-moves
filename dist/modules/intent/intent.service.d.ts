import { CreateIntentDto } from './dto/create-intent.dto';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IntentUtility } from './intent.utility';
export declare class IntentService {
    private readonly orchestratorService;
    private readonly prisma;
    private readonly utility;
    private readonly logger;
    constructor(orchestratorService: OrchestratorService, prisma: PrismaService, utility: IntentUtility);
    processIntent(createIntentDto: CreateIntentDto): Promise<{
        status: string;
        intentId: string;
        message: string;
        nonce: string;
    }>;
    private verifySignature;
}
