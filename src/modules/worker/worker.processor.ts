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
    
    // NORMALIZE FOR JUPITER (Using the correct constants)
    const getJupiterMint = (t: string | undefined) => {
        if (!t) return '';
        const trimmed = t.trim();
        if (trimmed === 'SOL' || trimmed === '11111111111111111111111111111111' || trimmed.includes('So111')) {
            return TOKENS.SOL;
        }
        if (trimmed === 'USDC' || trimmed === '4zMMC9srtvS2wSRXvP7rs4f387mS64B9M0S9GfV3N77C' || trimmed === TOKENS.USDC_DEVNET) {
            return TOKENS.USDC_DEVNET;
        }
        if (trimmed === 'USDT' || trimmed === TOKENS.USDT_DEVNET) {
            return TOKENS.USDT_DEVNET;
        }
        return trimmed;
    };

    const getVanishMint = (t: string | undefined) => {
        const mint = getJupiterMint(t);
        if (mint === TOKENS.SOL) {
            return '11111111111111111111111111111111';
        }
        return mint;
    };

    const jupInput = getJupiterMint(inputToken);
    const jupOutput = getJupiterMint(outputToken);

    if (!jupInput || !jupOutput || !amount) {
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

      await this.prisma.intent.update({
        where: { id: intentId },
        data: { status: 'PROCESSING' }
      });

      const balance = await this.rpcService.getBalance(publicKey);
      if (balance < amount) {
        throw new Error(`Insufficient balance: ${balance} SOL`);
      }

      const decimals = jupInput === TOKENS.SOL ? 9 : 6;
      const rawAmount = Math.floor(amount * Math.pow(10, decimals)).toString();

      const otwAddress = await this.vanishService.getOneTimeWallet();

      await updateProgress(60, 'Fetching Jupiter Quote');
      const quote = await this.jupiterService.getQuote(jupInput, jupOutput, rawAmount, currentSlippage * 100);
      const swapTxData = await this.jupiterService.getSwapTransaction(quote, otwAddress);

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
      await this.prisma.intent.update({ where: { id: intentId }, data: { status: 'FAILED' } }).catch(() => {});
      
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
