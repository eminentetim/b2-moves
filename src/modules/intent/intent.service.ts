import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { CreateIntentDto } from './dto/create-intent.dto';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IntentUtility } from './intent.utility';
import { TelegramService } from '../telegram/telegram.service';
import { TradingService } from '../trading/trading.service';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly prisma: PrismaService,
    private readonly utility: IntentUtility,
    private readonly telegramService: TelegramService,
    private readonly tradingService: TradingService,
  ) {}

  async processIntent(createIntentDto: CreateIntentDto) {
    this.logger.log(`Processing intent for user: ${createIntentDto.userId} (Action: ${createIntentDto.action || 'SWAP'})`);

    const isValid = this.verifySignature(createIntentDto);
    if (!isValid) {
      this.logger.error(`Invalid signature for user: ${createIntentDto.userId}`);
      throw new UnauthorizedException('Invalid signature');
    }

    // 1. Ensure User exists and link wallet
    await this.prisma.user.upsert({
      where: { telegramId: createIntentDto.userId },
      update: { solanaPublicKey: createIntentDto.publicKey },
      create: { 
        telegramId: createIntentDto.userId,
        solanaPublicKey: createIntentDto.publicKey,
      },
    });

    // ACTION: LINK_WALLET
    if (createIntentDto.action === 'LINK_WALLET') {
        await this.telegramService.notifyUser(
            createIntentDto.userId, 
            `🛡️ *Stealth Activation Confirmed*\n\nYour identity is now linked to: \`${createIntentDto.publicKey}\`\n\nYou are ready to move in silence.`
        );
        return { status: 'success', message: 'Wallet linked successfully' };
    }

    // ACTION: CREATE_LIMIT_ORDER
    if (createIntentDto.action === 'CREATE_LIMIT_ORDER') {
        await this.tradingService.createLimitOrder(createIntentDto);
        await this.telegramService.notifyUser(
            createIntentDto.userId,
            `🎯 *Limit Order Set*\n\nBuy ${createIntentDto.outputToken} when price hits \`${(createIntentDto as any).triggerPrice}\`.\n\n_Your move is queued in the shadows._`
        );
        return { status: 'success', message: 'Limit order created' };
    }

    // ACTION: CREATE_DCA_ORDER
    if (createIntentDto.action === 'CREATE_DCA_ORDER') {
        await this.tradingService.createDcaOrder(createIntentDto);
        await this.telegramService.notifyUser(
            createIntentDto.userId,
            `🔁 *DCA Strategy Active*\n\nBuying ${createIntentDto.outputToken} ${ (createIntentDto as any).frequency }.\n\n_Persistence is the ultimate stealth._`
        );
        return { status: 'success', message: 'DCA order created' };
    }

    // ACTION: UPDATE_POSITION_PROTECTION
    if (createIntentDto.action === 'UPDATE_POSITION_PROTECTION') {
        await this.tradingService.updatePositionProtection(createIntentDto);
        await this.telegramService.notifyUser(
            createIntentDto.userId,
            `🛡️ *Position Protection Active*\n\nTP/SL levels synced for ${ (createIntentDto as any).tokenMint }.\n\n_Your exits are now automated and private._`
        );
        return { status: 'success', message: 'Position protection updated' };
    }

    // ACTION: AUTHORIZE_REBALANCE
    if (createIntentDto.action === 'AUTHORIZE_REBALANCE') {
        const rebalanceIntentId = (createIntentDto as any).intentId;
        this.logger.log(`Authorizing Rebalance: ${rebalanceIntentId}`);
        
        await this.prisma.rebalanceIntent.update({
            where: { id: rebalanceIntentId },
            data: { status: 'EXECUTING' }
        });

        // Trigger the first chunk execution (or queue all chunks)
        const rebalanceIntent = await this.prisma.rebalanceIntent.findUnique({
            where: { id: rebalanceIntentId },
            include: { chunks: true }
        });

        if (rebalanceIntent) {
            for (const chunk of rebalanceIntent.chunks) {
                // Create a standard Intent record for each chunk for tracking
                const intent = await this.prisma.intent.create({
                    data: {
                        userId: rebalanceIntent.userId,
                        inputToken: chunk.inputToken,
                        outputToken: chunk.outputToken,
                        amount: chunk.amount,
                        slippage: rebalanceIntent.slippage,
                        status: 'PENDING',
                    }
                });

                // Queue each chunk as a standard execution job
                await this.orchestratorService.addIntentToQueue({
                    userId: rebalanceIntent.userId,
                    inputToken: chunk.inputToken,
                    outputToken: chunk.outputToken,
                    amount: chunk.amount,
                    publicKey: createIntentDto.publicKey,
                    signature: createIntentDto.signature, // Use the authorization signature
                    timestamp: createIntentDto.timestamp,
                    messageId: rebalanceIntent.messageId as number,
                    intentId: intent.id, // CRITICAL: Pass the intent ID
                } as any);
            }
        }

        return { status: 'success', message: 'Rebalance authorized and executing' };
    }

    // ACTION: STANDARD SWAP
    if (!createIntentDto.inputToken || !createIntentDto.outputToken || !createIntentDto.amount) {
        throw new Error('Missing swap details in intent');
    }

    const intent = await this.prisma.intent.create({
      data: {
        userId: createIntentDto.userId,
        inputToken: createIntentDto.inputToken,
        outputToken: createIntentDto.outputToken,
        amount: createIntentDto.amount,
        slippage: createIntentDto.slippage ?? 0.5,
        status: 'PENDING',
      },
    });

    await this.orchestratorService.addIntentToQueue({
      ...createIntentDto,
      intentId: intent.id // Ensure this is explicitly set and wins
    } as any);

    return {
      status: 'queued',
      intentId: intent.id,
      message: 'Intent verified and queued for execution',
    };
  }

  private verifySignature(dto: CreateIntentDto): boolean {
    try {
      const { signature, publicKey } = dto;
      const messageString = this.utility.createSignableMessage(dto);
      const messageUint8 = new TextEncoder().encode(messageString);
      const signatureUint8 = Buffer.from(signature, 'base64');
      const publicKeyUint8 = bs58.decode(publicKey);

      return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`);
      return false;
    }
  }
}
