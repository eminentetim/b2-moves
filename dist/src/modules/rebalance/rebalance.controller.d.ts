import { PrismaService } from '../../database/prisma/prisma.service';
export declare class RebalanceController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRebalanceIntent(id: string): Promise<{
        chunks: {
            inputToken: string;
            outputToken: string;
            amount: number;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            txId: string | null;
            outAmount: number | null;
            rebalanceIntentId: string;
            delayMs: number;
        }[];
    } & {
        userId: string;
        slippage: number;
        messageId: number | null;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        targetWeights: string;
        snapshotT0: string | null;
        snapshotT1: string | null;
        plan: string | null;
    }>;
}
