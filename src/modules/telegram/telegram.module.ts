import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { SwapWizard } from './swap.wizard';
import { OnboardingWizard } from './onboarding.wizard';
import { RebalanceWizard } from './rebalance.wizard';
import { LimitOrderWizard } from './limit-order.wizard';
import { DcaWizard } from './dca.wizard';
import { PositionsWizard } from './positions.wizard';
import { RpcModule } from '../rpc/rpc.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { PrismaModule } from '../../database/prisma/prisma.module';

@Module({
  imports: [RpcModule, OrchestratorModule, PrismaModule],
  providers: [
    TelegramService,
    TelegramUpdate,
    SwapWizard,
    OnboardingWizard,
    RebalanceWizard,
    LimitOrderWizard,
    DcaWizard,
    PositionsWizard,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
