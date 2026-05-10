import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { JupiterService } from '../jupiter/jupiter.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class RebalanceProcessor extends WorkerHost {
    private readonly prisma;
    private readonly rpcService;
    private readonly jupiterService;
    private readonly telegramService;
    private readonly logger;
    constructor(prisma: PrismaService, rpcService: RpcService, jupiterService: JupiterService, telegramService: TelegramService);
    process(job: Job<{
        rebalanceIntentId: string;
        telegramId: string;
        messageId?: number;
    }>): Promise<void>;
}
