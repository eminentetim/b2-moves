import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
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
  ) {
    super();
  }

  async process(job: Job<ExtendedIntentDto, any, string>): Promise<any> {
    let { intentId, userId, inputToken, outputToken, amount, slippage, publicKey, signature } = job.data;
    
    this.logger.log(`Worker: Processing Intent [ID: ${intentId}] for User [${userId}]`);

    if (!intentId) {
        this.logger.error('Worker: ABORTING - Missing intentId in job data.');
        return;
    }

    // 1. NORMALIZE FOR JUPITER (Must be real mint addresses)
    const getJupiterMint = (t: string | undefined) => {
        if (!t) return '';
        const trimmed = t.trim();
        if (trimmed === 'SOL' || trimmed === '11111111111111111111111111111111' || trimmed.includes('So111')) {
            return 'So11111111111111111111111111111111111111112';
        }
        // Devnet Mints - Standardizing on TARDIS
        if (trimmed === 'USDC' || trimmed === 'USDT' || trimmed === 'TARDIS' || trimmed === TOKENS.TARDIS) {
            return TOKENS.TARDIS;
        }
        return trimmed;
    };

    // 2. NORMALIZE FOR VANISH (Must be 32-ones for SOL)
    const getVanishMint = (t: string | undefined) => {
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
      const updateProgress = async (percent: number, step: string) => {
          if (job.data.messageId) {
            const bar = this.telegramService.getProgressBar(percent);
            const statusMsg = `🛸 *B2 Move in Progress*\n\nStep: ${step}\n${bar}\n\n_Trade is being obfuscated via Vanish Core._`;
            await this.telegramService.updateStatus(userId, job.data.messageId, statusMsg);
          }
      };

      await updateProgress(10, 'Initializing Stealth Route');

      try {
          await this.prisma.intent.update({
            where: { id: intentId },
            data: { status: 'PROCESSING' }
          });
      } catch (err) {
          this.logger.error(`Worker: Failed to update intent status to PROCESSING for ID ${intentId}: ${err.message}`);
      }

      // 1. Pre-execution balance check
      await updateProgress(25, 'Verifying Balance');
      const balance = await this.rpcService.getBalance(publicKey);
      if (balance < amount && jupInput === 'So11111111111111111111111111111111111111112') {
        throw new Error(`Insufficient balance: ${balance} SOL`);
      }

      // Convert amount to raw units
      const isSolInput = jupInput === 'So11111111111111111111111111111111111111112';
      const decimals = isSolInput ? 9 : 6;
      const rawAmount = Math.floor(amount * Math.pow(10, decimals)).toString();

      // 2. Vanish OTW
      await updateProgress(40, 'Generating One-Time Wallet');
      const otwAddress = await this.vanishService.getOneTimeWallet();

      // 3. Jupiter Quote
      await updateProgress(60, 'Fetching Jupiter Quote');
      const quote = await this.jupiterService.getQuote(jupInput, jupOutput, rawAmount, currentSlippage * 100);
      const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);

      // 4. Vanish Execution
      await updateProgress(80, 'Executing Ghost Transaction');
      
      const tradeResult = await this.vanishService.createTrade({
        user_address: publicKey,
        source_token_address: getVanishMint(inputToken),
        target_token_address: getVanishMint(outputToken),
        amount: rawAmount,
        swap_transaction: swapTxData.swapTransaction,
        one_time_wallet: otwAddress,
        user_signature: signature,
        timestamp: job.data.timestamp!,
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

      const successMsg = `✅ *Ghost Move Complete*\n\nTarget: ${outputToken}\nStatus: ${finalStatus.status}\nPrivacy Score: 99%\nTX: \`${tradeResult.tx_id}\`\n\n_Your funds have been delivered to a fresh, unlinked address._`;
      
      if (job.data.messageId) {
          await this.telegramService.updateStatus(userId, job.data.messageId, successMsg);
      } else {
          await this.telegramService.notifyUser(userId, successMsg);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Intent ${intentId} FAILED: ${error.message}`);
      if (intentId) {
          await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => {});
      }
      
      const failMsg = `❌ *Ghost Move Failed*\n\nReason: ${error.message}`;
      if (job.data.messageId) {
          await this.telegramService.updateStatus(userId, job.data.messageId, failMsg);
      } else {
          await this.telegramService.notifyUser(userId, failMsg);
      }
      throw error;
    }
  }
}
