import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { IntentService } from './intent.service';
import { IntentUtility } from './intent.utility';
import { CreateIntentDto } from './dto/create-intent.dto';

@Controller('intent')
export class IntentController {
  constructor(
    private readonly intentService: IntentService,
    private readonly utility: IntentUtility,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() createIntentDto: CreateIntentDto) {
    return this.intentService.processIntent(createIntentDto);
  }

  @Get('message')
  async getMessage(@Query() query: any) {
    // Returns the exact string the user needs to sign with @solana/wallet-adapter
    return {
      message: this.utility.createSignableMessage(query),
    };
  }
}
