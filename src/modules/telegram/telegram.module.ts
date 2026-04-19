import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { SwapWizard } from './swap.wizard';

@Module({
  providers: [TelegramService, TelegramUpdate, SwapWizard],
  exports: [TelegramService],
})
export class TelegramModule {}
