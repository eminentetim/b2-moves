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
var TradingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingProcessor = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../database/prisma/prisma.service");
const jupiter_service_1 = require("../jupiter/jupiter.service");
const orchestrator_service_1 = require("../orchestrator/orchestrator.service");
const tokens_1 = require("../../common/constants/tokens");
let TradingProcessor = TradingProcessor_1 = class TradingProcessor {
    prisma;
    jupiterService;
    orchestratorService;
    logger = new common_1.Logger(TradingProcessor_1.name);
    constructor(prisma, jupiterService, orchestratorService) {
        this.prisma = prisma;
        this.jupiterService = jupiterService;
        this.orchestratorService = orchestratorService;
    }
    async handleCron() {
        this.logger.debug('Running Trading Trigger Engine...');
        await Promise.all([
            this.processLimitOrders(),
            this.processDcaOrders(),
            this.processPositions(),
        ]);
    }
    async processLimitOrders() {
        const activeOrders = await this.prisma.limitOrder.findMany({
            where: { status: 'ACTIVE' },
            include: { user: true },
        });
        if (activeOrders.length === 0)
            return;
        const tokens = new Set();
        activeOrders.forEach(o => {
            tokens.add(this.getMint(o.inputToken));
            tokens.add(this.getMint(o.outputToken));
        });
        const prices = await this.jupiterService.getPrices(Array.from(tokens));
        for (const order of activeOrders) {
            const inputMint = this.getMint(order.inputToken);
            const outputMint = this.getMint(order.outputToken);
            const inputPrice = prices[inputMint];
            const outputPrice = prices[outputMint];
            if (!inputPrice || !outputPrice)
                continue;
            let trigger = false;
            const isSelling = order.outputToken.includes('USD') || order.outputToken === 'TARDIS';
            if (isSelling) {
                if (inputPrice >= order.triggerPrice)
                    trigger = true;
            }
            else {
                if (outputPrice <= order.triggerPrice)
                    trigger = true;
            }
            if (trigger) {
                this.logger.log(`Triggering Limit Order ${order.id} for user ${order.userId}`);
                await this.prisma.limitOrder.update({
                    where: { id: order.id },
                    data: { status: 'FILLED' },
                });
                const intent = await this.prisma.intent.create({
                    data: {
                        userId: order.userId,
                        inputToken: order.inputToken,
                        outputToken: order.outputToken,
                        amount: order.amountIn,
                        slippage: order.slippage,
                        status: 'PENDING',
                    }
                });
                await this.orchestratorService.addIntentToQueue({
                    userId: order.userId,
                    publicKey: order.user.solanaPublicKey,
                    signature: order.signature,
                    timestamp: order.timestamp,
                    nonce: order.nonce,
                    inputToken: order.inputToken,
                    outputToken: order.outputToken,
                    amount: order.amountIn,
                    slippage: order.slippage,
                    intentId: intent.id,
                });
            }
        }
    }
    async processDcaOrders() {
        const now = new Date();
        const dueOrders = await this.prisma.dcaOrder.findMany({
            where: {
                status: 'ACTIVE',
                nextExecutionAt: { lte: now }
            },
            include: { user: true },
        });
        for (const order of dueOrders) {
            this.logger.log(`Triggering DCA Order ${order.id} for user ${order.userId}`);
            let nextExecutionAt = new Date();
            if (order.frequency === 'daily')
                nextExecutionAt.setDate(now.getDate() + 1);
            else if (order.frequency === 'weekly')
                nextExecutionAt.setDate(now.getDate() + 7);
            else if (order.frequency === 'monthly')
                nextExecutionAt.setMonth(now.getMonth() + 1);
            await this.prisma.dcaOrder.update({
                where: { id: order.id },
                data: { nextExecutionAt },
            });
            const intent = await this.prisma.intent.create({
                data: {
                    userId: order.userId,
                    inputToken: order.fromToken,
                    outputToken: order.toToken,
                    amount: order.amount,
                    slippage: order.slippage,
                    status: 'PENDING',
                }
            });
            await this.orchestratorService.addIntentToQueue({
                userId: order.userId,
                publicKey: order.user.solanaPublicKey,
                signature: order.signature,
                timestamp: order.timestamp,
                nonce: order.nonce,
                inputToken: order.fromToken,
                outputToken: order.toToken,
                amount: order.amount,
                slippage: order.slippage,
                intentId: intent.id,
            });
        }
    }
    async processPositions() {
        const openPositions = await this.prisma.position.findMany({
            where: {
                status: 'OPEN',
                OR: [
                    { takeProfitPrice: { not: null } },
                    { stopLossPrice: { not: null } },
                ]
            },
            include: { user: true },
        });
        if (openPositions.length === 0)
            return;
        const mints = Array.from(new Set(openPositions.map((p) => p.tokenMint)));
        const prices = await this.jupiterService.getPrices(mints);
        for (const pos of openPositions) {
            const currentPrice = prices[pos.tokenMint];
            if (!currentPrice)
                continue;
            let trigger = false;
            if (pos.takeProfitPrice && currentPrice >= pos.takeProfitPrice)
                trigger = true;
            if (pos.stopLossPrice && currentPrice <= pos.stopLossPrice)
                trigger = true;
            if (trigger) {
                this.logger.log(`Triggering TP/SL for Position ${pos.id} for user ${pos.userId}`);
                await this.prisma.position.update({
                    where: { id: pos.id },
                    data: { status: 'CLOSED' },
                });
                const intent = await this.prisma.intent.create({
                    data: {
                        userId: pos.userId,
                        inputToken: pos.tokenMint,
                        outputToken: 'USDC',
                        amount: pos.amount,
                        slippage: 0.5,
                        status: 'PENDING',
                    }
                });
                await this.orchestratorService.addIntentToQueue({
                    userId: pos.userId,
                    publicKey: pos.user.solanaPublicKey,
                    signature: pos.signature,
                    timestamp: pos.timestamp,
                    nonce: pos.nonce,
                    inputToken: pos.tokenMint,
                    outputToken: 'USDC',
                    amount: pos.amount,
                    slippage: 0.5,
                    intentId: intent.id,
                });
            }
        }
    }
    getMint(symbol) {
        if (symbol === 'SOL')
            return tokens_1.TOKENS.SOL;
        if (symbol === 'TARDIS')
            return tokens_1.TOKENS.TARDIS;
        if (symbol === 'USDC') {
            const isDevnet = process.env.SOLANA_CLUSTER === 'devnet';
            return isDevnet ? tokens_1.TOKENS.USDC_DEVNET : tokens_1.TOKENS.USDC_MAINNET;
        }
        const tokenKey = Object.keys(tokens_1.TOKENS).find(k => k.startsWith(symbol));
        return tokenKey ? tokens_1.TOKENS[tokenKey] : symbol;
    }
};
exports.TradingProcessor = TradingProcessor;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradingProcessor.prototype, "handleCron", null);
exports.TradingProcessor = TradingProcessor = TradingProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jupiter_service_1.JupiterService,
        orchestrator_service_1.OrchestratorService])
], TradingProcessor);
//# sourceMappingURL=trading.processor.js.map