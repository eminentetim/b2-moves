import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { SwapWizard } from './swap.wizard';
import { OnboardingWizard } from './onboarding.wizard';

@Module({
  providers: [TelegramService, TelegramUpdate, SwapWizard, OnboardingWizard],
  exports: [TelegramService],
})
export class TelegramModule {}
