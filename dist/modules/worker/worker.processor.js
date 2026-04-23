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
        const { intentId, userId, inputToken, outputToken, amount, slippage, publicKey, messageId } = job.data;
        if (!inputToken || !outputToken || !amount) {
            this.logger.error(`Intent ${intentId} is missing critical swap data.`);
            return;
        }
        const currentSlippage = slippage ?? 0.5;
        try {
            const updateProgress = async (percent, step) => {
                if (messageId) {
                    const bar = this.telegramService.getProgressBar(percent);
                    const statusMsg = `🛸 *B2 Move in Progress*\n\n` +
                        `Step: ${step}\n` +
                        `${bar}\n\n` +
                        `_Trade is being obfuscated via Vanish Core._`;
                    await this.telegramService.updateStatus(userId, messageId, statusMsg);
                }
            };
            await updateProgress(10, 'Initializing Stealth Route');
            await this.prisma.intent.update({
                where: { id: intentId },
                data: { status: 'PROCESSING' }
            });
            await updateProgress(25, 'Verifying Balance');
            const balance = await this.rpcService.getBalance(publicKey);
            if (balance < amount) {
                throw new Error(`Insufficient balance: ${balance} SOL`);
            }
            await updateProgress(40, 'Generating One-Time Wallet');
            const otwAddress = await this.vanishService.getOneTimeWallet();
            await updateProgress(60, 'Fetching Jupiter Quote');
            const quote = await this.jupiterService.getQuote(inputToken, outputToken, amount, currentSlippage * 100);
            const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);
            await updateProgress(80, 'Executing Ghost Transaction');
            const tradeResult = await this.vanishService.createTrade({
                user_address: publicKey,
                source_token_address: inputToken === 'SOL' ? '11111111111111111111111111111111' : inputToken,
                target_token_address: outputToken,
                amount: (amount * 10 ** 9).toString(),
                swap_transaction: swapTxData.swapTransaction,
                one_time_wallet: otwAddress,
                user_signature: job.data.signature,
                timestamp: job.data.timestamp,
            });
            await updateProgress(95, 'Settling Privacy Layer');
            const finalStatus = await this.vanishService.commitAction(tradeResult.tx_id);
            await this.prisma.intent.update({
                where: { id: intentId },
                data: {
                    status: finalStatus.status.toUpperCase(),
                    txId: tradeResult.tx_id,
                    outAmount: parseFloat(quote.outAmount) / 10 ** 6,
                    privacyScore: 0.99
                }
            });
            const successMsg = `✅ *Ghost Move Complete*\n\n` +
                `Target: ${outputToken}\n` +
                `Status: ${finalStatus.status}\n` +
                `Privacy Score: 99%\n` +
                `TX: \`${tradeResult.tx_id}\`\n\n` +
                `_Your funds have been delivered to a fresh, unlinked address._`;
            if (messageId) {
                await this.telegramService.updateStatus(userId, messageId, successMsg);
            }
            else {
                await this.telegramService.notifyUser(userId, successMsg);
            }
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Intent ${intentId} FAILED: ${error.message}`);
            await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => { });
            const failMsg = `❌ *Ghost Move Failed*\n\nReason: ${error.message}`;
            if (messageId) {
                await this.telegramService.updateStatus(userId, messageId, failMsg);
            }
            else {
                await this.telegramService.notifyUser(userId, failMsg);
            }
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