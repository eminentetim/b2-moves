import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { RpcService } from '../rpc/rpc.service';
import { JupiterService } from '../jupiter/jupiter.service';
import { TelegramService } from '../telegram/telegram.service';
import { TOKENS } from '../../common/constants/tokens';

@Processor('rebalance')
export class RebalanceProcessor extends WorkerHost {
  private readonly logger = new Logger(RebalanceProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rpcService: RpcService,
    private readonly jupiterService: JupiterService,
    private readonly telegramService: TelegramService
  ) {
    super();
  }

  async process(job: Job<{ rebalanceIntentId: string; telegramId: string; messageId?: number }>) {
    const { rebalanceIntentId, telegramId, messageId } = job.data;
    this.logger.log(`Processing rebalance plan for: ${rebalanceIntentId}`);

    const intent = await this.prisma.rebalanceIntent.findUnique({
      where: { id: rebalanceIntentId },
      include: { user: true }
    });

    if (!intent || !intent.user.solanaPublicKey) return;

    const pubkey = intent.user.solanaPublicKey;

    try {
      if (messageId) {
        await this.telegramService.updateStatus(telegramId, messageId, `🛸 *Rebalance Planner*\n\n` + this.telegramService.getProgressBar(20) + `\n_Fetching Portfolio Snapshot (T0)..._`);
      }

      const solBalance = await this.rpcService.getBalance(pubkey);
      const splTokens = await this.rpcService.getTokensForWallet(pubkey);

      const targetWeights: Record<string, number> = JSON.parse(intent.targetWeights);
      const mintsToFetch = [TOKENS.SOL, ...Object.values(TOKENS).filter(m => m.length > 30)];
      const prices = await this.jupiterService.getPrices(mintsToFetch);

      const currentPortfolio: Record<string, { amount: number, usd: number, mint: string }> = {};
      let totalUsd = 0;

      const solPrice = prices[TOKENS.SOL] || 0;
      const solUsd = solBalance * solPrice;
      currentPortfolio['SOL'] = { amount: solBalance, usd: solUsd, mint: TOKENS.SOL };
      totalUsd += solUsd;

      for (const t of splTokens) {
        let symbol = Object.keys(TOKENS).find(k => TOKENS[k as keyof typeof TOKENS] === t.mint);
        if (!symbol) continue; 
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

      const deltas: { symbol: string, mint: string, deltaUsd: number, action: 'BUY' | 'SELL' }[] = [];
      
      for (const symbol of Object.keys(targetWeights)) {
        const currentUsd = currentPortfolio[symbol]?.usd || 0;
        
        // Find mint for symbol
        let mint = currentPortfolio[symbol]?.mint;
        if (!mint) {
            const tokenKey = Object.keys(TOKENS).find(k => k.startsWith(symbol));
            if (tokenKey) mint = TOKENS[tokenKey as keyof typeof TOKENS];
        }
        
        if (!mint) continue;

        const targetUsd = totalUsd * (targetWeights[symbol] / 100);
        const deltaUsd = currentUsd - targetUsd;

        if (Math.abs(deltaUsd) > 5) { // Minimum threshold $5
          deltas.push({
            symbol,
            mint,
            deltaUsd,
            action: deltaUsd > 0 ? 'SELL' : 'BUY'
          });
        }
      }

      const trades: any[] = [];
      const sells = deltas.filter(d => d.action === 'SELL');
      const buys = deltas.filter(d => d.action === 'BUY');

      const isBasePresent = Object.keys(targetWeights).includes('USDC');
      let baseMint = isBasePresent ? currentPortfolio['USDC']?.mint || TOKENS.USDC_MAINNET : TOKENS.USDC_MAINNET;
      const baseSymbol = 'USDC';

      for (const sell of sells) {
         if (sell.symbol === baseSymbol) continue;
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
         if (buy.symbol === baseSymbol) continue;
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
        await this.telegramService.updateStatus(telegramId, messageId, `🛸 *Rebalance Plan Generated*\n\nTarget Allocations:\n${Object.entries(targetWeights).map(([k,v])=> `• ${k}: ${v}%`).join('\n')}\n\n` +
          `The engine has optimally split your deltas into **${trades.length} stealth chunks**.\n\n` +
          `_Ready to authorize execution array._`);

        // Use bot instance through telegramService
        const bot = (this.telegramService as any).bot;
        await bot.telegram.sendMessage(telegramId, `Please review and authorize the Rebalance Plan:`, {
          reply_markup: {
            inline_keyboard: [[
              { 
                text: '🛡️ Authorize Multi-Chunk Execution', 
                web_app: { url: `${frontendUrl}/?intentId=${rebalanceIntentId}&userId=${telegramId}` } 
              }
            ]]
          }
        });
      }

    } catch (err) {
      this.logger.error(`Rebalance Planning Failed: ${err.message}`);
      await this.prisma.rebalanceIntent.update({ where: { id: rebalanceIntentId }, data: { status: 'FAILED' } });
      if (messageId) {
        await this.telegramService.updateStatus(telegramId, messageId, `❌ *Rebalance Planning Failed*\n\nReason: ${err.message}`);
      }
    }
  }
}
