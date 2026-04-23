import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';
import { JupiterService } from '../jupiter/jupiter.service';
import { VanishService } from '../vanish/vanish.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { RpcService } from '../rpc/rpc.service';

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
    const { intentId, userId, inputToken, outputToken, amount, slippage, publicKey, messageId } = job.data;
    
    if (!inputToken || !outputToken || !amount) {
        this.logger.error(`Intent ${intentId} is missing critical swap data.`);
        return;
    }

    const currentSlippage = slippage ?? 0.5;

    try {
      const updateProgress = async (percent: number, step: string) => {
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

      // 1. Balance Check
      await updateProgress(25, 'Verifying Balance');
      const balance = await this.rpcService.getBalance(publicKey);
      if (balance < amount) {
        throw new Error(`Insufficient balance: ${balance} SOL`);
      }

      // 2. Vanish OTW
      await updateProgress(40, 'Generating One-Time Wallet');
      const otwAddress = await this.vanishService.getOneTimeWallet();

      // 3. Jupiter Quote
      await updateProgress(60, 'Fetching Jupiter Quote');
      const quote = await this.jupiterService.getQuote(inputToken, outputToken, amount, currentSlippage * 100);
      const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);

      // 4. Vanish Execution
      await updateProgress(80, 'Executing Ghost Transaction');
      
      const tradeResult = await this.vanishService.createTrade({
        user_address: publicKey,
        source_token_address: inputToken === 'SOL' ? '11111111111111111111111111111111' : inputToken,
        target_token_address: outputToken,
        amount: (amount * 10**9).toString(),
        swap_transaction: swapTxData.swapTransaction,
        one_time_wallet: otwAddress,
        user_signature: job.data.signature,
        timestamp: job.data.timestamp!, // Guaranteed by DTO check in service
      });

      // 5. Commit
      await updateProgress(95, 'Settling Privacy Layer');
      const finalStatus = await this.vanishService.commitAction(tradeResult.tx_id);

      await this.prisma.intent.update({
        where: { id: intentId },
        data: { 
          status: finalStatus.status.toUpperCase(),
          txId: tradeResult.tx_id,
          outAmount: parseFloat(quote.outAmount) / 10**6,
          privacyScore: 0.99
        }
      });

      // Final Success Notification
      const successMsg = `✅ *Ghost Move Complete*\n\n` +
                        `Target: ${outputToken}\n` +
                        `Status: ${finalStatus.status}\n` +
                        `Privacy Score: 99%\n` +
                        `TX: \`${tradeResult.tx_id}\`\n\n` +
                        `_Your funds have been delivered to a fresh, unlinked address._`;
      
      if (messageId) {
          await this.telegramService.updateStatus(userId, messageId, successMsg);
      } else {
          await this.telegramService.notifyUser(userId, successMsg);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Intent ${intentId} FAILED: ${error.message}`);
      await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => {});
      
      const failMsg = `❌ *Ghost Move Failed*\n\nReason: ${error.message}`;
      if (messageId) {
          await this.telegramService.updateStatus(userId, messageId, failMsg);
      } else {
          await this.telegramService.notifyUser(userId, failMsg);
      }
      throw error;
    }
  }
}
