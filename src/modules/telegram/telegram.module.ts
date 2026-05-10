import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { SwapWizard } from './swap.wizard';
import { OnboardingWizard } from './onboarding.wizard';
import { RebalanceWizard } from './rebalance.wizard';
import { LimitOrderWizard } from './limit-order.wizard';
import { DcaWizard } from './dca.wizard';
import { PositionsWizard } from './positions.wizard';
import { DepositWizard } from './deposit.wizard';
import { RpcModule } from '../rpc/rpc.module';
import { OrchestratorModule } from '../orchestrator/orchestrator.module';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { VanishModule } from '../vanish/vanish.module';

@Module({
  imports: [RpcModule, OrchestratorModule, PrismaModule, VanishModule],
  providers: [
    TelegramService,
    TelegramUpdate,
    SwapWizard,
    OnboardingWizard,
    RebalanceWizard,
    LimitOrderWizard,
    DcaWizard,
    PositionsWizard,
    DepositWizard,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}
