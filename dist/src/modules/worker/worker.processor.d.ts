import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';
import { JupiterService } from '../jupiter/jupiter.service';
import { VanishService } from '../vanish/vanish.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { RpcService } from '../rpc/rpc.service';
interface ExtendedIntentDto extends CreateIntentDto {
    intentId: string;
}
export declare class WorkerProcessor extends WorkerHost {
    private readonly jupiterService;
    private readonly vanishService;
    private readonly prisma;
    private readonly telegramService;
    private readonly rpcService;
    private readonly logger;
    constructor(jupiterService: JupiterService, vanishService: VanishService, prisma: PrismaService, telegramService: TelegramService, rpcService: RpcService);
    process(job: Job<ExtendedIntentDto, any, string>): Promise<any>;
}
export {};
