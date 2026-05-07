import { Scenes } from 'telegraf';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
export declare class RebalanceWizard {
    private readonly prisma;
    private readonly rpcService;
    private readonly orchestratorService;
    constructor(prisma: PrismaService, rpcService: RpcService, orchestratorService: OrchestratorService);
    step1(ctx: Scenes.WizardContext): Promise<void>;
    step2(ctx: Scenes.WizardContext): Promise<void>;
    step3(ctx: Scenes.WizardContext, msg: {
        text: string;
    }): Promise<unknown>;
}
