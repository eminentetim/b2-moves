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
var TradingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma/prisma.service");
let TradingService = TradingService_1 = class TradingService {
    prisma;
    logger = new common_1.Logger(TradingService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createLimitOrder(dto) {
        this.logger.log(`Creating limit order for user ${dto.userId}: ${dto.amountIn} ${dto.inputToken} -> ${dto.outputToken} @ ${dto.triggerPrice}`);
        return this.prisma.limitOrder.create({
            data: {
                userId: dto.userId,
                inputToken: dto.inputToken,
                outputToken: dto.outputToken,
                amountIn: dto.amountIn,
                triggerPrice: dto.triggerPrice,
                status: 'ACTIVE',
                signature: dto.signature,
                timestamp: dto.timestamp,
                nonce: dto.nonce,
                slippage: dto.slippage ?? 0.5,
            },
        });
    }
    async createDcaOrder(dto) {
        this.logger.log(`Creating DCA order for user ${dto.userId}: ${dto.amount} ${dto.fromToken} every ${dto.frequency}`);
        let nextExecutionAt = new Date();
        return this.prisma.dcaOrder.create({
            data: {
                userId: dto.userId,
                fromToken: dto.fromToken,
                toToken: dto.toToken,
                amount: dto.amount,
                frequency: dto.frequency,
                nextExecutionAt,
                status: 'ACTIVE',
                signature: dto.signature,
                timestamp: dto.timestamp,
                nonce: dto.nonce,
                slippage: dto.slippage ?? 0.5,
            },
        });
    }
    async updatePositionProtection(dto) {
        this.logger.log(`Updating TP/SL for user ${dto.userId} token ${dto.tokenMint}`);
        return this.prisma.position.upsert({
            where: {
                userId_tokenMint: {
                    userId: dto.userId,
                    tokenMint: dto.tokenMint
                }
            },
            update: {
                takeProfitPrice: dto.takeProfitPrice,
                stopLossPrice: dto.stopLossPrice,
                signature: dto.signature,
                timestamp: dto.timestamp,
                nonce: dto.nonce,
            },
            create: {
                userId: dto.userId,
                tokenMint: dto.tokenMint,
                amount: dto.amount || 0,
                entryPrice: dto.entryPrice || 0,
                takeProfitPrice: dto.takeProfitPrice,
                stopLossPrice: dto.stopLossPrice,
                signature: dto.signature,
                timestamp: dto.timestamp,
                nonce: dto.nonce,
                status: 'OPEN',
            },
        });
    }
    async getActiveLimitOrders(userId) {
        return this.prisma.limitOrder.findMany({
            where: { userId, status: 'ACTIVE' },
        });
    }
    async getActiveDcaOrders(userId) {
        return this.prisma.dcaOrder.findMany({
            where: { userId, status: 'ACTIVE' },
        });
    }
    async getUserPositions(userId) {
        return this.prisma.position.findMany({
            where: { userId, status: 'OPEN' },
        });
    }
    async cancelLimitOrder(id) {
        return this.prisma.limitOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
};
exports.TradingService = TradingService;
exports.TradingService = TradingService = TradingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TradingService);
//# sourceMappingURL=trading.service.js.map