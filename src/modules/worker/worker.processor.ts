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
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

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
    
    this.logger.log(`Worker: Processing Intent [ID: ${intentId}] for User [${userId}] (Attempt: ${job.attemptsMade + 1})`);

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
        if (trimmed === 'USDC' || trimmed === TOKENS.USDC_MAINNET) {
            return TOKENS.USDC_MAINNET;
        }
        if (trimmed === 'USDT' || trimmed === TOKENS.USDT_MAINNET) {
            return TOKENS.USDT_MAINNET;
        }
        if (trimmed === 'BONK' || trimmed === TOKENS.BONK) {
            return TOKENS.BONK;
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
            // Only update status in Telegram if it's the first attempt to avoid weird jumps
            if (job.attemptsMade === 0) {
                await this.telegramService.updateStatus(userId, job.data.messageId, statusMsg);
            }
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
      if (jupInput === 'So11111111111111111111111111111111111111112') {
          const balance = await this.rpcService.getBalance(publicKey);
          if (balance < amount) {
            throw new Error(`Insufficient SOL: ${balance.toFixed(4)} available, ${amount} needed.`);
          }
      } else {
          const tokens = await this.rpcService.getTokensForWallet(publicKey);
          const inputTokenData = tokens.find(t => t.mint === jupInput);
          const currentBalance = inputTokenData?.amount || 0;
          if (currentBalance < amount) {
            throw new Error(`Insufficient ${inputToken}: ${currentBalance.toFixed(2)} available, ${amount} needed.`);
          }
      }

      // Convert amount to raw units
      const getDecimals = (mint: string): number => {
          if (mint === 'So11111111111111111111111111111111111111112' || mint === '11111111111111111111111111111111') return 9;
          if (mint === TOKENS.USDC_MAINNET || mint === TOKENS.USDT_MAINNET) return 6;
          if (mint === TOKENS.BONK) return 5;
          return 6; // Default fallback
      };

      const decimals = getDecimals(jupInput);
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
      
      const intentRecord = await this.prisma.intent.findUnique({
          where: { id: intentId },
          include: { dcaOrder: true, limitOrder: true, user: true }
      });

      let finalSignature = signature;
      let finalTimestamp = job.data.timestamp!;
      let finalPublicKey = publicKey;

      // AUTOMATION UPGRADE: If it's a DCA or Limit Order, generate a FRESH signature using the Agent Key
      if (intentRecord?.dcaOrderId || intentRecord?.limitOrderId) {
          const user = intentRecord.user;
          if (user.agentPublicKey && user.agentSecretKey) {
              this.logger.log(`Worker: Generating Automated Agent Signature for Intent ${intentId}`);
              
              const now = Date.now().toString();
              const agentSecretKey = Buffer.from(user.agentSecretKey, 'base64');
              
              // Construct the Vanish Trade Message
              const resolve = (t: string) => {
                  if (t === 'SOL') return TOKENS.SOL;
                  if (t === 'USDC') return TOKENS.USDC_MAINNET;
                  if (t === 'USDT') return TOKENS.USDT_MAINNET;
                  if (t === 'BONK') return TOKENS.BONK;
                  return t;
              };
              const normalize = (m: string) => m === TOKENS.SOL ? '11111111111111111111111111111111' : m;
              
              const sourceMint = resolve(inputToken!);
              const targetMint = resolve(outputToken!);
              
              const msg = `By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\nDetails: trade:${normalize(sourceMint)}:${normalize(targetMint)}:${rawAmount}:12000000:${now}:1000000`;
              
              const sigBytes = nacl.sign.detached(new TextEncoder().encode(msg), agentSecretKey);
              
              finalSignature = Buffer.from(sigBytes).toString('base64');
              finalTimestamp = now;
              finalPublicKey = user.agentPublicKey;
              
              this.logger.log(`Worker: Ghost Move Authorized via Agent Wallet [${user.agentPublicKey}]`);
          }
      }

      const tradeResult = await this.vanishService.createTrade({
        user_address: finalPublicKey,
        source_token_address: getVanishMint(inputToken),
        target_token_address: getVanishMint(outputToken),
        amount: rawAmount,
        swap_transaction: swapTxData.swapTransaction,
        one_time_wallet: otwAddress,
        user_signature: finalSignature,
        timestamp: finalTimestamp,
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
      const isAuthError = error.response?.status === 401;
      const isVanishBalanceError = error.response?.status === 400 && error.response?.data?.message?.includes('Insufficient');
      const isLocalBalanceError = error.message.includes('Insufficient');
      
      const maxAttempts = job.opts.attempts || 1;
      const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;

      this.logger.error(`Intent ${intentId} FAILED (Attempt ${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`);

      // CIRCUIT BREAKER: If it's an Auth Error, Balance Error, or the Final Attempt, fail permanently and notify
      if (isAuthError || isVanishBalanceError || isLocalBalanceError || isLastAttempt) {
          if (intentId) {
              const intent = await this.prisma.intent.update({ 
                  where: { id: intentId }, 
                  data: { status: 'FAILED' } 
              });

              // CRITICAL: Pause the parent automated order to stop the spam loop
              if (isLocalBalanceError || isVanishBalanceError || isAuthError) {
                  if (intent.dcaOrderId) {
                      this.logger.warn(`Pausing DCA Order ${intent.dcaOrderId} due to fatal error: ${error.message}`);
                      await this.prisma.dcaOrder.update({
                          where: { id: intent.dcaOrderId },
                          data: { status: 'PAUSED' }
                      });
                  }
                  if (intent.limitOrderId) {
                      this.logger.warn(`Cancelling Limit Order ${intent.limitOrderId} due to fatal error: ${error.message}`);
                      await this.prisma.limitOrder.update({
                          where: { id: intent.limitOrderId },
                          data: { status: 'FAILED' }
                      });
                  }
              }
          }
          
          let failReason = error.message;
          if (isAuthError) failReason = 'Authentication Expired. Please sign a new intent.';
          if (isVanishBalanceError) failReason = 'Insufficient balance in your **Private Vanish Profile**. Please use the /deposit command to fund your stealth account.';
          
          const failMsg = `❌ *Ghost Move Failed*\n\nReason: ${failReason}\n\n_Strategy has been paused to prevent further failures._`;
          
          if (job.data.messageId) {
              await this.telegramService.updateStatus(userId, job.data.messageId, failMsg);
          } else {
              await this.telegramService.notifyUser(userId, failMsg);
          }

          if (isAuthError || isVanishBalanceError || isLocalBalanceError) {
              // Return normally to avoid BullMQ retrying on fatal errors
              return { success: false, error: `${failReason} - Retries Disabled` };
          }
      }

      // Re-throw for BullMQ to handle retry if not the last attempt
      throw error;
    }
  }
}
