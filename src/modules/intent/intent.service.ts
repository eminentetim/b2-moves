import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { CreateIntentDto } from './dto/create-intent.dto';
import { OrchestratorService } from '../orchestrator/orchestrator.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { IntentUtility } from './intent.utility';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name);

  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly prisma: PrismaService,
    private readonly utility: IntentUtility,
  ) {}

  async processIntent(createIntentDto: CreateIntentDto) {
    this.logger.log(`Processing intent for user: ${createIntentDto.userId}`);

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

    // 2. Persist Intent in Database
    const intent = await this.prisma.intent.create({
      data: {
        userId: createIntentDto.userId,
        inputToken: createIntentDto.inputToken,
        outputToken: createIntentDto.outputToken,
        amount: createIntentDto.amount,
        slippage: createIntentDto.slippage,
        status: 'PENDING',
      },
    });

    // 3. Push to BullMQ for Orchestrator to pick up
    await this.orchestratorService.addIntentToQueue({
      ...createIntentDto,
      intentId: intent.id // Pass the DB ID for tracking
    } as any);

    this.logger.log(`Intent ${intent.id} verified and enqueued for user: ${createIntentDto.userId}`);
    return {
      status: 'queued',
      intentId: intent.id,
      message: 'Intent verified and queued for execution',
      nonce: createIntentDto.nonce,
    };
  }

  private verifySignature(dto: CreateIntentDto): boolean {
    try {
      const { signature, publicKey } = dto;
      
      const messageString = this.utility.createSignableMessage(dto);
      const messageUint8 = new TextEncoder().encode(messageString);
      const signatureUint8 = bs58.decode(signature);
      const publicKeyUint8 = bs58.decode(publicKey);

      return nacl.sign.detached.verify(
        messageUint8,
        signatureUint8,
        publicKeyUint8,
      );
    } catch (error) {
      this.logger.error(`Error verifying signature: ${error.message}`);
      return false;
    }
  }
}
