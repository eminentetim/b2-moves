import { PrismaService } from '../../database/prisma/prisma.service';
import { JupiterService } from '../jupiter/jupiter.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
export declare class TradingProcessor {
    private readonly prisma;
    private readonly jupiterService;
    private readonly orchestratorService;
    private readonly logger;
    constructor(prisma: PrismaService, jupiterService: JupiterService, orchestratorService: OrchestratorService);
    handleCron(): Promise<void>;
    private processLimitOrders;
    private processDcaOrders;
    private processPositions;
    private getMint;
}
