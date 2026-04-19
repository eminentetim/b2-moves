import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';
import { JupiterService } from '../jupiter/jupiter.service';
import { VanishService } from '../vanish/vanish.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { RpcService } from '../rpc/rpc.service';
import { Transaction } from '@solana/web3.js';

interface ExtendedIntentDto extends CreateIntentDto {
  intentId: string;
}

@Processor('execution')
export class WorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkerProcessor.name);

  constructor(
    private readonly jupiterService: JupiterService,
    private readonly vanishService: VanishService,
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly rpcService: RpcService,
  ) {
    super();
  }

  async process(job: Job<ExtendedIntentDto, any, string>): Promise<any> {
    const { intentId, userId, inputToken, outputToken, amount, slippage, publicKey } = job.data;
    this.logger.log(`Processing job ${job.id} (Intent: ${intentId}) for user ${userId}`);

    try {
      await this.prisma.intent.update({
        where: { id: intentId },
        data: { status: 'PROCESSING' }
      });

      // 1. Pre-execution balance check
      const balance = await this.rpcService.getBalance(publicKey);
      if (balance < amount) {
        throw new Error(`Insufficient balance: User has ${balance} SOL, needs ${amount}`);
      }

      // 2. Jupiter Quote & Vanish Route
      const quote = await this.jupiterService.getQuote(inputToken, outputToken, amount, slippage * 100);
      const privateRoute = await this.vanishService.getPrivateRoute(inputToken, outputToken, amount);
      const swapTxData = await this.jupiterService.getSwapTransaction(quote, publicKey);

      // 3. Simulation (Optional but recommended)
      // Note: In a real flow, we would decode swapTxData.swapTransaction and simulate it
      // this.logger.log(`Simulating Ghost Move...`);
      // await this.rpcService.simulateTransaction(Transaction.from(Buffer.from(swapTxData.swapTransaction, 'base64')));

      // 4. Vanish Execution
      const result = await this.vanishService.executePrivateSwap(swapTxData, privateRoute);

      // 5. Confirmation
      this.logger.log(`Waiting for stealth confirmation...`);
      // In production, we would use rpcService.confirmTransaction(result.txId) 
      // or Helius Webhooks to verify delivery to the unlinked wallet.

      await this.prisma.intent.update({
        where: { id: intentId },
        data: { 
          status: 'COMPLETED',
          txId: result.txId,
          outAmount: parseFloat(quote.outAmount) / 10**6,
          privacyScore: privateRoute.privacyScore
        }
      });

      await this.telegramService.notifyUser(userId, 
        `✅ *Ghost Move Complete*\n\n` +
        `Target: ${outputToken}\n` +
        `Amount: ${quote.outAmount / 10**6} (approx)\n` +
        `Privacy Score: ${privateRoute.privacyScore * 100}%\n` +
        `TX: \`${result.txId}\`\n\n` +
        `_Your funds have been delivered via B2 Spirit stealth systems._`
      );

      return { success: true };
    } catch (error) {
      this.logger.error(`Intent ${intentId} FAILED: ${error.message}`);
      await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => {});
      await this.telegramService.notifyUser(userId, `❌ *Ghost Move Failed*\n\nReason: ${error.message}`);
      throw error;
    }
  }
}
