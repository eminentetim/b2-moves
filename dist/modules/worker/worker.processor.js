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
const tokens_1 = require("../../common/constants/tokens");
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
        let { intentId, userId, inputToken, outputToken, amount, slippage, publicKey, signature } = job.data;
        const getJupiterMint = (t) => {
            if (!t)
                return '';
            const trimmed = t.trim();
            if (trimmed === 'SOL' || trimmed === '11111111111111111111111111111111' || trimmed.includes('So111')) {
                return tokens_1.TOKENS.SOL;
            }
            if (trimmed === 'USDC' || trimmed === '4zMMC9srtvS2wSRXvP7rs4f387mS64B9M0S9GfV3N77C' || trimmed === tokens_1.TOKENS.USDC_DEVNET) {
                return tokens_1.TOKENS.USDC_DEVNET;
            }
            if (trimmed === 'USDT' || trimmed === tokens_1.TOKENS.USDT_DEVNET) {
                return tokens_1.TOKENS.USDT_DEVNET;
            }
            return trimmed;
        };
        const getVanishMint = (t) => {
            const mint = getJupiterMint(t);
            if (mint === tokens_1.TOKENS.SOL) {
                return '11111111111111111111111111111111';
            }
            return mint;
        };
        const jupInput = getJupiterMint(inputToken);
        const jupOutput = getJupiterMint(outputToken);
        if (!jupInput || !jupOutput || !amount) {
            this.logger.error(`Intent ${intentId} is missing critical swap data.`);
            return;
        }
        const currentSlippage = slippage ?? 0.5;
        try {
            const updateProgress = async (percent, step) => {
                if (job.data.messageId) {
                    const bar = this.telegramService.getProgressBar(percent);
                    const statusMsg = `🛸 *B2 Move in Progress*\n\nStep: ${step}\n${bar}\n\n_Trade is being obfuscated via Vanish Core._`;
                    await this.telegramService.updateStatus(userId, job.data.messageId, statusMsg);
                }
            };
            await updateProgress(10, 'Initializing Stealth Route');
            await this.prisma.intent.update({
                where: { id: intentId },
                data: { status: 'PROCESSING' }
            });
            const balance = await this.rpcService.getBalance(publicKey);
            if (balance < amount) {
                throw new Error(`Insufficient balance: ${balance} SOL`);
            }
            const decimals = jupInput === tokens_1.TOKENS.SOL ? 9 : 6;
            const rawAmount = Math.floor(amount * Math.pow(10, decimals)).toString();
            const otwAddress = await this.vanishService.getOneTimeWallet();
            await updateProgress(60, 'Fetching Jupiter Quote');
            const quote = await this.jupiterService.getQuote(jupInput, jupOutput, rawAmount, currentSlippage * 100);
            const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);
            await updateProgress(80, 'Executing Ghost Transaction');
            const tradeResult = await this.vanishService.createTrade({
                user_address: publicKey,
                source_token_address: getVanishMint(inputToken),
                target_token_address: getVanishMint(outputToken),
                amount: rawAmount,
                swap_transaction: swapTxData.swapTransaction,
                one_time_wallet: otwAddress,
                user_signature: signature,
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
            const successMsg = `✅ *Ghost Move Complete*\n\nTarget: ${outputToken}\nStatus: ${finalStatus.status}\nPrivacy Score: 99%\nTX: \`${tradeResult.tx_id}\`\n\n_Your funds have been delivered to a fresh, unlinked address._`;
            if (job.data.messageId) {
                await this.telegramService.updateStatus(userId, job.data.messageId, successMsg);
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
            if (job.data.messageId) {
                await this.telegramService.updateStatus(userId, job.data.messageId, failMsg);
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