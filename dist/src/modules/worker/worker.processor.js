"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const nacl = __importStar(require("tweetnacl"));
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
        this.logger.log(`Worker: Processing Intent [ID: ${intentId}] for User [${userId}] (Attempt: ${job.attemptsMade + 1})`);
        if (!intentId) {
            this.logger.error('Worker: ABORTING - Missing intentId in job data.');
            return;
        }
        const getJupiterMint = (t) => {
            if (!t)
                return '';
            const trimmed = t.trim();
            if (trimmed === 'SOL' || trimmed === '11111111111111111111111111111111' || trimmed.includes('So111')) {
                return 'So11111111111111111111111111111111111111112';
            }
            if (trimmed === 'USDC' || trimmed === tokens_1.TOKENS.USDC_MAINNET) {
                return tokens_1.TOKENS.USDC_MAINNET;
            }
            if (trimmed === 'USDT' || trimmed === tokens_1.TOKENS.USDT_MAINNET) {
                return tokens_1.TOKENS.USDT_MAINNET;
            }
            if (trimmed === 'BONK' || trimmed === tokens_1.TOKENS.BONK) {
                return tokens_1.TOKENS.BONK;
            }
            return trimmed;
        };
        const getVanishMint = (t) => {
            const mint = getJupiterMint(t);
            if (mint === 'So11111111111111111111111111111111111111112') {
                return '11111111111111111111111111111111';
            }
            return mint;
        };
        const jupInput = getJupiterMint(inputToken);
        const jupOutput = getJupiterMint(outputToken);
        if (!jupInput || !jupOutput || amount === undefined || amount === null) {
            this.logger.error(`Intent ${intentId} is missing critical swap data.`);
            return;
        }
        const currentSlippage = slippage ?? 0.5;
        try {
            const updateProgress = async (percent, step) => {
                if (job.data.messageId) {
                    const bar = this.telegramService.getProgressBar(percent);
                    const statusMsg = `🛸 *B2 Move in Progress*\n\nStep: ${step}\n${bar}\n\n_Trade is being obfuscated via Vanish Core._`;
                    if (job.attemptsMade === 0) {
                        await this.telegramService.updateStatus(userId, job.data.messageId, statusMsg);
                    }
                }
            };
            await updateProgress(10, 'Initializing Stealth Route');
            try {
                await this.prisma.intent.update({
                    where: { id: intentId },
                    data: { status: 'PROCESSING' }
                });
            }
            catch (err) {
                this.logger.error(`Worker: Failed to update intent status to PROCESSING for ID ${intentId}: ${err.message}`);
            }
            await updateProgress(25, 'Verifying Balance');
            if (jupInput === 'So11111111111111111111111111111111111111112') {
                const balance = await this.rpcService.getBalance(publicKey);
                if (balance < amount) {
                    throw new Error(`Insufficient SOL: ${balance.toFixed(4)} available, ${amount} needed.`);
                }
            }
            else {
                const tokens = await this.rpcService.getTokensForWallet(publicKey);
                const inputTokenData = tokens.find(t => t.mint === jupInput);
                const currentBalance = inputTokenData?.amount || 0;
                if (currentBalance < amount) {
                    throw new Error(`Insufficient ${inputToken}: ${currentBalance.toFixed(2)} available, ${amount} needed.`);
                }
            }
            const getDecimals = (mint) => {
                if (mint === 'So11111111111111111111111111111111111111112' || mint === '11111111111111111111111111111111')
                    return 9;
                if (mint === tokens_1.TOKENS.USDC_MAINNET || mint === tokens_1.TOKENS.USDT_MAINNET)
                    return 6;
                if (mint === tokens_1.TOKENS.BONK)
                    return 5;
                return 6;
            };
            const decimals = getDecimals(jupInput);
            const rawAmount = Math.floor(amount * Math.pow(10, decimals)).toString();
            await updateProgress(40, 'Generating One-Time Wallet');
            const otwAddress = await this.vanishService.getOneTimeWallet();
            await updateProgress(60, 'Fetching Jupiter Quote');
            const quote = await this.jupiterService.getQuote(jupInput, jupOutput, rawAmount, currentSlippage * 100);
            const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);
            await updateProgress(80, 'Executing Ghost Transaction');
            const intentRecord = await this.prisma.intent.findUnique({
                where: { id: intentId },
                include: { dcaOrder: true, limitOrder: true, user: true }
            });
            let finalSignature = signature;
            let finalTimestamp = job.data.timestamp;
            let finalPublicKey = publicKey;
            if (intentRecord?.dcaOrderId || intentRecord?.limitOrderId) {
                const user = intentRecord.user;
                if (user.agentPublicKey && user.agentSecretKey) {
                    this.logger.log(`Worker: Generating Automated Agent Signature for Intent ${intentId}`);
                    const now = Date.now().toString();
                    const agentSecretKey = Buffer.from(user.agentSecretKey, 'base64');
                    const resolve = (t) => {
                        if (t === 'SOL')
                            return tokens_1.TOKENS.SOL;
                        if (t === 'USDC')
                            return tokens_1.TOKENS.USDC_MAINNET;
                        if (t === 'USDT')
                            return tokens_1.TOKENS.USDT_MAINNET;
                        if (t === 'BONK')
                            return tokens_1.TOKENS.BONK;
                        return t;
                    };
                    const normalize = (m) => m === tokens_1.TOKENS.SOL ? '11111111111111111111111111111111' : m;
                    const sourceMint = resolve(inputToken);
                    const targetMint = resolve(outputToken);
                    const msg = `By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\nDetails: trade:${normalize(sourceMint)}:${normalize(targetMint)}:${rawAmount}:12000000:${now}:1000000`;
                    const sigBytes = nacl.sign.detached(new TextEncoder().encode(msg), agentSecretKey);
                    finalSignature = Buffer.from(sigBytes).toString('base64');
                    finalTimestamp = now;
                    finalPublicKey = user.agentPublicKey;
                    this.logger.log(`Worker: Ghost Move Authorized via Agent Wallet [${user.agentPublicKey}]`);
                }
            }
            const tradeResult = await this.vanishService.createTrade({
                user_address: finalPublicKey,
                source_token_address: getVanishMint(inputToken),
                target_token_address: getVanishMint(outputToken),
                amount: rawAmount,
                swap_transaction: swapTxData.swapTransaction,
                one_time_wallet: otwAddress,
                user_signature: finalSignature,
                timestamp: finalTimestamp,
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
            const isAuthError = error.response?.status === 401;
            const isVanishBalanceError = error.response?.status === 400 && error.response?.data?.message?.includes('Insufficient');
            const isLocalBalanceError = error.message.includes('Insufficient');
            const maxAttempts = job.opts.attempts || 1;
            const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;
            this.logger.error(`Intent ${intentId} FAILED (Attempt ${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`);
            if (isAuthError || isVanishBalanceError || isLocalBalanceError || isLastAttempt) {
                if (intentId) {
                    const intent = await this.prisma.intent.update({
                        where: { id: intentId },
                        data: { status: 'FAILED' }
                    });
                    if (isLocalBalanceError || isVanishBalanceError || isAuthError) {
                        if (intent.dcaOrderId) {
                            this.logger.warn(`Pausing DCA Order ${intent.dcaOrderId} due to fatal error: ${error.message}`);
                            await this.prisma.dcaOrder.update({
                                where: { id: intent.dcaOrderId },
                                data: { status: 'PAUSED' }
                            });
                        }
                        if (intent.limitOrderId) {
                            this.logger.warn(`Cancelling Limit Order ${intent.limitOrderId} due to fatal error: ${error.message}`);
                            await this.prisma.limitOrder.update({
                                where: { id: intent.limitOrderId },
                                data: { status: 'FAILED' }
                            });
                        }
                    }
                }
                let failReason = error.message;
                if (isAuthError)
                    failReason = 'Authentication Expired. Please sign a new intent.';
                if (isVanishBalanceError)
                    failReason = 'Insufficient balance in your **Private Vanish Profile**. Please use the /deposit command to fund your stealth account.';
                const failMsg = `❌ *Ghost Move Failed*\n\nReason: ${failReason}\n\n_Strategy has been paused to prevent further failures._`;
                if (job.data.messageId) {
                    await this.telegramService.updateStatus(userId, job.data.messageId, failMsg);
                }
                else {
                    await this.telegramService.notifyUser(userId, failMsg);
                }
                if (isAuthError || isVanishBalanceError || isLocalBalanceError) {
                    return { success: false, error: `${failReason} - Retries Disabled` };
                }
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