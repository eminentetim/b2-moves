import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateIntentDto } from '../intent/dto/create-intent.dto';
import { JupiterService } from '../jupiter/jupiter.service';
import { VanishService } from '../vanish/vanish.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { RpcService } from '../rpc/rpc.service';
import { TOKENS } from '../../common/constants/tokens';

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
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<ExtendedIntentDto, any, string>): Promise<any> {
    const { intentId, userId, inputToken, outputToken, amount, slippage, publicKey, signature, timestamp } = job.data;
    
    if (!amount || !inputToken || !outputToken) {
        this.logger.error(`Intent ${intentId} is missing critical swap data.`);
        return;
    }

    try {
      const updateProgress = async (percent: number, step: string) => {
          if (job.data.messageId) {
            const bar = this.telegramService.getProgressBar(percent);
            await this.telegramService.updateStatus(userId, job.data.messageId, `🛸 *B2 Move in Progress*\n\nStep: ${step}\n${bar}`);
          }
      };

      await updateProgress(10, 'Initializing Stealth Route');
      await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'PROCESSING' } });

      const balance = await this.rpcService.getBalance(publicKey);
      if (balance < amount) throw new Error(`Insufficient balance: ${balance} SOL`);

      // 1. Convert to raw amount (Smallest units)
      const isSol = inputToken === 'SOL' || inputToken.includes('So111');
      const decimals = isSol ? 9 : 6;
      const rawAmount = Math.floor(amount * Math.pow(10, decimals)).toString();

      // 2. Fetch OTW
      await updateProgress(40, 'Generating One-Time Wallet');
      const otwAddress = await this.vanishService.getOneTimeWallet();

      // 3. Jupiter Quote & Build
      await updateProgress(60, 'Fetching Jupiter Quote');
      const quote = await this.jupiterService.getQuote(inputToken, outputToken, rawAmount, (slippage ?? 0.5) * 100);
      const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);

      // 4. Vanish Execution
      await updateProgress(80, 'Executing Ghost Transaction');
      const tradeResult = await this.vanishService.createTrade({
        user_address: publicKey,
        source_token_address: isSol ? '11111111111111111111111111111111' : inputToken,
        target_token_address: (outputToken === 'SOL' || outputToken.includes('So111')) ? '11111111111111111111111111111111' : outputToken,
        amount: rawAmount,
        swap_transaction: swapTxData.swapTransaction,
        one_time_wallet: otwAddress,
        user_signature: signature,
        timestamp: timestamp!,
      });

      // 5. Finalize
      await updateProgress(95, 'Settling Privacy Layer');
      const finalStatus = await this.vanishService.commitAction(tradeResult.tx_id);

      await this.prisma.intent.update({
        where: { id: intentId },
        data: { status: finalStatus.status.toUpperCase(), txId: tradeResult.tx_id }
      });

      const successMsg = `✅ *Ghost Move Complete*\n\nTarget: ${outputToken}\nStatus: ${finalStatus.status}\nTX: \`${tradeResult.tx_id}\``;
      if (job.data.messageId) await this.telegramService.updateStatus(userId, job.data.messageId, successMsg);
      else await this.telegramService.notifyUser(userId, successMsg);

      return { success: true };
    } catch (error) {
      this.logger.error(`Intent ${intentId} FAILED: ${error.message}`);
      await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => {});
      const failMsg = `❌ *Ghost Move Failed*\n\nReason: ${error.message}`;
      if (job.data.messageId) await this.telegramService.updateStatus(userId, job.data.messageId, failMsg);
      else await this.telegramService.notifyUser(userId, failMsg);
      throw error;
    }
  }
}
