"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkerProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const jupiter_service_1 = require("../jupiter/jupiter.service");
const vanish_service_1 = require("../vanish/vanish.service");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
const rpc_service_1 = require("../rpc/rpc.service");
let WorkerProcessor = WorkerProcessor_1 = class WorkerProcessor extends bullmq_1.WorkerHost {
    jupiterService;
    vanishService;
    prisma;
    telegramService;
    rpcService;
    logger = new common_1.Logger(WorkerProcessor_1.name);
    constructor(jupiterService, vanishService, prisma, telegramService, rpcService) {
        super();
        this.jupiterService = jupiterService;
        this.vanishService = vanishService;
        this.prisma = prisma;
        this.telegramService = telegramService;
        this.rpcService = rpcService;
    }
    async process(job) {
        const { intentId, userId, inputToken, outputToken, amount, slippage, publicKey } = job.data;
        this.logger.log(`Processing job ${job.id} (Intent: ${intentId}) for user ${userId}`);
        try {
            await this.prisma.intent.update({
                where: { id: intentId },
                data: { status: 'PROCESSING' }
            });
            const balance = await this.rpcService.getBalance(publicKey);
            if (balance < amount) {
                throw new Error(`Insufficient balance: User has ${balance} SOL, needs ${amount}`);
            }
            const quote = await this.jupiterService.getQuote(inputToken, outputToken, amount, slippage * 100);
            const privateRoute = await this.vanishService.getPrivateRoute(inputToken, outputToken, amount);
            const swapTxData = await this.jupiterService.getSwapTransaction(quote, publicKey);
            const result = await this.vanishService.executePrivateSwap(swapTxData, privateRoute);
            this.logger.log(`Waiting for stealth confirmation...`);
            await this.prisma.intent.update({
                where: { id: intentId },
                data: {
                    status: 'COMPLETED',
                    txId: result.txId,
                    outAmount: parseFloat(quote.outAmount) / 10 ** 6,
                    privacyScore: privateRoute.privacyScore
                }
            });
            await this.telegramService.notifyUser(userId, `✅ *Ghost Move Complete*\n\n` +
                `Target: ${outputToken}\n` +
                `Amount: ${quote.outAmount / 10 ** 6} (approx)\n` +
                `Privacy Score: ${privateRoute.privacyScore * 100}%\n` +
                `TX: \`${result.txId}\`\n\n` +
                `_Your funds have been delivered via B2 Spirit stealth systems._`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Intent ${intentId} FAILED: ${error.message}`);
            await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => { });
            await this.telegramService.notifyUser(userId, `❌ *Ghost Move Failed*\n\nReason: ${error.message}`);
            throw error;
        }
    }
};
exports.WorkerProcessor = WorkerProcessor;
exports.WorkerProcessor = WorkerProcessor = WorkerProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('execution'),
    __metadata("design:paramtypes", [jupiter_service_1.JupiterService,
        vanish_service_1.VanishService,
        prisma_service_1.PrismaService,
        telegram_service_1.TelegramService,
        rpc_service_1.RpcService])
], WorkerProcessor);
//# sourceMappingURL=worker.processor.js.map