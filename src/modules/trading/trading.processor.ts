import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma/prisma.service';
import { JupiterService } from '../jupiter/jupiter.service';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { TOKENS } from '../../common/constants/tokens';

@Injectable()
export class TradingProcessor {
  private readonly logger = new Logger(TradingProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jupiterService: JupiterService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  @Cron('*/30 * * * * *') // Every 30 seconds
  async handleCron() {
    this.logger.debug('Running Trading Trigger Engine...');
    await Promise.all([
      this.processLimitOrders(),
      this.processDcaOrders(),
      this.processPositions(),
    ]);
  }

  private async processLimitOrders() {
    const activeOrders = await this.prisma.limitOrder.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true },
    });

    if (activeOrders.length === 0) return;

    // Get unique tokens involved
    const tokens = new Set<string>();
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
      
      if (!inputPrice || !outputPrice) continue;

      let trigger = false;
      
      // Determine direction: Is user BUYING or SELLING the 'volatile' asset?
      // For simplicity, assume if outputToken is USDC/USDT/TARDIS, they are SELLING inputToken.
      const isSelling = order.outputToken.includes('USD') || order.outputToken === 'TARDIS';
      
      if (isSelling) {
          // Sell when price is HIGH
          if (inputPrice >= order.triggerPrice) trigger = true;
      } else {
          // Buy when price is LOW
          if (outputPrice <= order.triggerPrice) trigger = true;
      }
      
      if (trigger) {
        this.logger.log(`Triggering Limit Order ${order.id} for user ${order.userId}`);
        
        await this.prisma.limitOrder.update({
          where: { id: order.id },
          data: { status: 'FILLED' },
        });

        // Create a formal Intent for tracking
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
          publicKey: order.user.solanaPublicKey!,
          signature: order.signature!,
          timestamp: order.timestamp!,
          nonce: order.nonce!,
          inputToken: order.inputToken,
          outputToken: order.outputToken,
          amount: order.amountIn,
          slippage: order.slippage,
          intentId: intent.id,
        } as any);
      }
    }
  }

  private async processDcaOrders() {
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

      // Calculate next execution time
      let nextExecutionAt = new Date();
      if (order.frequency === 'daily') nextExecutionAt.setDate(now.getDate() + 1);
      else if (order.frequency === 'weekly') nextExecutionAt.setDate(now.getDate() + 7);
      else if (order.frequency === 'monthly') nextExecutionAt.setMonth(now.getMonth() + 1);

      await this.prisma.dcaOrder.update({
        where: { id: order.id },
        data: { nextExecutionAt },
      });

      // Create a formal Intent for tracking
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
        publicKey: order.user.solanaPublicKey!,
        signature: order.signature!,
        timestamp: order.timestamp!,
        nonce: order.nonce!,
        inputToken: order.fromToken,
        outputToken: order.toToken,
        amount: order.amount,
        slippage: order.slippage,
        intentId: intent.id,
      } as any);
    }
  }

  private async processPositions() {
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

    if (openPositions.length === 0) return;

    const mints = Array.from(new Set(openPositions.map((p) => p.tokenMint)));
    const prices = await this.jupiterService.getPrices(mints);

    for (const pos of openPositions) {
      const currentPrice = prices[pos.tokenMint];
      if (!currentPrice) continue;

      let trigger = false;
      if (pos.takeProfitPrice && currentPrice >= pos.takeProfitPrice) trigger = true;
      if (pos.stopLossPrice && currentPrice <= pos.stopLossPrice) trigger = true;

      if (trigger) {
        this.logger.log(`Triggering TP/SL for Position ${pos.id} for user ${pos.userId}`);

        await this.prisma.position.update({
          where: { id: pos.id },
          data: { status: 'CLOSED' },
        });

        // Create a formal Intent for tracking
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

        // Exit position: sell tokenMint for USDC
        await this.orchestratorService.addIntentToQueue({
          userId: pos.userId,
          publicKey: pos.user.solanaPublicKey!,
          signature: pos.signature!,
          timestamp: pos.timestamp!,
          nonce: pos.nonce!,
          inputToken: pos.tokenMint,
          outputToken: 'USDC',
          amount: pos.amount,
          slippage: 0.5,
          intentId: intent.id,
        } as any);
      }
    }
  }

  private getMint(symbol: string): string {
    if (symbol === 'SOL') return TOKENS.SOL;
    if (symbol === 'TARDIS') return TOKENS.TARDIS;
    if (symbol === 'USDC') {
        const isDevnet = process.env.SOLANA_CLUSTER === 'devnet';
        return isDevnet ? TOKENS.USDC_DEVNET : TOKENS.USDC_MAINNET;
    }
    // Map other symbols if needed or return symbol as mint
    const tokenKey = Object.keys(TOKENS).find(k => k.startsWith(symbol));
    return tokenKey ? TOKENS[tokenKey as keyof typeof TOKENS] : symbol;
  }
}
