import { CreateIntentDto } from './dto/create-intent.dto';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IntentUtility } from './intent.utility';
import { TelegramService } from '../telegram/telegram.service';
import { TradingService } from '../trading/trading.service';
export declare class IntentService {
    private readonly orchestratorService;
    private readonly prisma;
    private readonly utility;
    private readonly telegramService;
    private readonly tradingService;
    private readonly logger;
    constructor(orchestratorService: OrchestratorService, prisma: PrismaService, utility: IntentUtility, telegramService: TelegramService, tradingService: TradingService);
    processIntent(createIntentDto: CreateIntentDto): Promise<{
        status: string;
        message: string;
        intentId?: undefined;
    } | {
        status: string;
        intentId: string;
        message: string;
    }>;
    private verifySignature;
}
