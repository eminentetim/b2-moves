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
var RebalanceProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RebalanceProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const rpc_service_1 = require("../rpc/rpc.service");
const jupiter_service_1 = require("../jupiter/jupiter.service");
const telegram_service_1 = require("../telegram/telegram.service");
const tokens_1 = require("../../common/constants/tokens");
let RebalanceProcessor = RebalanceProcessor_1 = class RebalanceProcessor extends bullmq_1.WorkerHost {
    prisma;
    rpcService;
    jupiterService;
    telegramService;
    logger = new common_1.Logger(RebalanceProcessor_1.name);
    constructor(prisma, rpcService, jupiterService, telegramService) {
        super();
        this.prisma = prisma;
        this.rpcService = rpcService;
        this.jupiterService = jupiterService;
        this.telegramService = telegramService;
    }
    async process(job) {
        const { rebalanceIntentId, telegramId, messageId } = job.data;
        this.logger.log(`Processing rebalance plan for: ${rebalanceIntentId}`);
        const intent = await this.prisma.rebalanceIntent.findUnique({
            where: { id: rebalanceIntentId },
            include: { user: true }
        });
        if (!intent || !intent.user.solanaPublicKey)
            return;
        const pubkey = intent.user.solanaPublicKey;
        try {
            if (messageId) {
                await this.telegramService.updateStatus(telegramId, messageId, `🛸 *Rebalance Planner*\n\n` + this.telegramService.getProgressBar(20) + `\n_Fetching Portfolio Snapshot (T0)..._`);
            }
            const solBalance = await this.rpcService.getBalance(pubkey);
            const splTokens = await this.rpcService.getTokensForWallet(pubkey);
            const targetWeights = JSON.parse(intent.targetWeights);
            const mintsToFetch = [tokens_1.TOKENS.SOL, ...Object.values(tokens_1.TOKENS).filter(m => m.length > 30)];
            const prices = await this.jupiterService.getPrices(mintsToFetch);
            const currentPortfolio = {};
            let totalUsd = 0;
            const solPrice = prices[tokens_1.TOKENS.SOL] || 0;
            const solUsd = solBalance * solPrice;
            currentPortfolio['SOL'] = { amount: solBalance, usd: solUsd, mint: tokens_1.TOKENS.SOL };
            totalUsd += solUsd;
            for (const t of splTokens) {
                let symbol = Object.keys(tokens_1.TOKENS).find(k => tokens_1.TOKENS[k] === t.mint);
                if (!symbol)
                    continue;
                symbol = symbol.split('_')[0];
                const price = prices[t.mint] || 0;
                const usd = t.amount * price;
                currentPortfolio[symbol] = { amount: t.amount, usd, mint: t.mint };
                totalUsd += usd;
            }
            await this.prisma.rebalanceIntent.update({
                where: { id: rebalanceIntentId },
                data: { snapshotT0: JSON.stringify(currentPortfolio), status: 'CALCULATED' }
            });
            if (messageId) {
                await this.telegramService.updateStatus(telegramId, messageId, `🛸 *Rebalance Planner*\n\n` + this.telegramService.getProgressBar(50) + `\n_Computing Target Values & Deltas..._`);
            }
            const deltas = [];
            for (const symbol of Object.keys(targetWeights)) {
                const currentUsd = currentPortfolio[symbol]?.usd || 0;
                let mint = currentPortfolio[symbol]?.mint;
                if (!mint) {
                    const tokenKey = Object.keys(tokens_1.TOKENS).find(k => k.startsWith(symbol));
                    if (tokenKey)
                        mint = tokens_1.TOKENS[tokenKey];
                }
                if (!mint)
                    continue;
                const targetUsd = totalUsd * (targetWeights[symbol] / 100);
                const deltaUsd = currentUsd - targetUsd;
                if (Math.abs(deltaUsd) > 5) {
                    deltas.push({
                        symbol,
                        mint,
                        deltaUsd,
                        action: deltaUsd > 0 ? 'SELL' : 'BUY'
                    });
                }
            }
            const trades = [];
            const sells = deltas.filter(d => d.action === 'SELL');
            const buys = deltas.filter(d => d.action === 'BUY');
            const isBasePresent = Object.keys(targetWeights).includes('USDC');
            let baseMint = isBasePresent ? currentPortfolio['USDC']?.mint || tokens_1.TOKENS.USDC_MAINNET : tokens_1.TOKENS.USDC_MAINNET;
            const baseSymbol = 'USDC';
            for (const sell of sells) {
                if (sell.symbol === baseSymbol)
                    continue;
                const sellPrice = prices[sell.mint] || 1;
                const amountToSell = sell.deltaUsd / sellPrice;
                const numChunks = Math.floor(Math.random() * 3) + 3;
                const chunkAmount = amountToSell / numChunks;
                for (let i = 0; i < numChunks; i++) {
                    const delayMs = Math.floor(Math.random() * 25000) + 5000;
                    const chunkAmountVaried = chunkAmount * (1 + (Math.random() * 0.2 - 0.1));
                    trades.push({
                        inputToken: sell.symbol,
                        outputToken: baseSymbol,
                        inputMint: sell.mint,
                        outputMint: baseMint,
                        amount: chunkAmountVaried,
                        delayMs
                    });
                }
            }
            for (const buy of buys) {
                if (buy.symbol === baseSymbol)
                    continue;
                const buyPrice = prices[buy.mint] || 1;
                const amountToBuy = Math.abs(buy.deltaUsd) / buyPrice;
                const numChunks = Math.floor(Math.random() * 3) + 3;
                const chunkAmount = amountToBuy / numChunks;
                for (let i = 0; i < numChunks; i++) {
                    const delayMs = Math.floor(Math.random() * 25000) + 5000;
                    const chunkAmountVaried = chunkAmount * (1 + (Math.random() * 0.2 - 0.1));
                    const amountToSellBase = chunkAmountVaried * buyPrice;
                    trades.push({
                        inputToken: baseSymbol,
                        outputToken: buy.symbol,
                        inputMint: baseMint,
                        outputMint: buy.mint,
                        amount: amountToSellBase,
                        delayMs
                    });
                }
            }
            await this.prisma.rebalanceIntent.update({
                where: { id: rebalanceIntentId },
                data: { plan: JSON.stringify(trades), status: 'PLANNED' }
            });
            for (const t of trades) {
                await this.prisma.tradeChunk.create({
                    data: {
                        rebalanceIntentId: rebalanceIntentId,
                        inputToken: t.inputToken,
                        outputToken: t.outputToken,
                        amount: t.amount,
                        delayMs: t.delayMs,
                    }
                });
            }
            if (messageId) {
                const frontendUrl = process.env.FRONTEND_URL || 'http://192.168.43.87:3000';
                await this.telegramService.updateStatus(telegramId, messageId, `🛸 *Rebalance Plan Generated*\n\nTarget Allocations:\n${Object.entries(targetWeights).map(([k, v]) => `• ${k}: ${v}%`).join('\n')}\n\n` +
                    `The engine has optimally split your deltas into **${trades.length} stealth chunks**.\n\n` +
                    `_Ready to authorize execution array._`);
                const bot = this.telegramService.bot;
                await bot.telegram.sendMessage(telegramId, `Please review and authorize the Rebalance Plan:`, {
                    reply_markup: {
                        inline_keyboard: [[
                                {
                                    text: '🛡️ Authorize Multi-Chunk Execution',
                                    web_app: { url: `${frontendUrl}/rebalance?intentId=${rebalanceIntentId}&userId=${telegramId}` }
                                }
                            ]]
                    }
                });
            }
        }
        catch (err) {
            this.logger.error(`Rebalance Planning Failed: ${err.message}`);
            await this.prisma.rebalanceIntent.update({ where: { id: rebalanceIntentId }, data: { status: 'FAILED' } });
            if (messageId) {
                await this.telegramService.updateStatus(telegramId, messageId, `❌ *Rebalance Planning Failed*\n\nReason: ${err.message}`);
            }
        }
    }
};
exports.RebalanceProcessor = RebalanceProcessor;
exports.RebalanceProcessor = RebalanceProcessor = RebalanceProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('rebalance'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rpc_service_1.RpcService,
        jupiter_service_1.JupiterService,
        telegram_service_1.TelegramService])
], RebalanceProcessor);
//# sourceMappingURL=rebalance.processor.js.map