import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateLimitOrderDto, CreateDcaOrderDto, UpdatePositionDto } from './dto/trading.dto';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLimitOrder(dto: any) {
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

  async createDcaOrder(dto: any) {
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

  async updatePositionProtection(dto: any) {
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

  async getActiveLimitOrders(userId: string) {
    return this.prisma.limitOrder.findMany({
      where: { userId, status: 'ACTIVE' },
    });
  }

  async getActiveDcaOrders(userId: string) {
    return this.prisma.dcaOrder.findMany({
      where: { userId, status: 'ACTIVE' },
    });
  }

  async getUserPositions(userId: string) {
    return this.prisma.position.findMany({
      where: { userId, status: 'OPEN' },
    });
  }

  async cancelLimitOrder(id: string) {
    return this.prisma.limitOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
