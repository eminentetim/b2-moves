import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { VanishService } from './vanish.service';

@Module({
  imports: [HttpModule],
  providers: [VanishService],
  exports: [VanishService],
})
export class VanishModule {}
