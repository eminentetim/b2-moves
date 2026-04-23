import { Controller, Post, Get, Query, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { IntentService } from './intent.service';
import { IntentUtility } from './intent.utility';
import { CreateIntentDto } from './dto/create-intent.dto';
import { GetMessageDto } from './dto/get-message.dto';

@Controller('intent')
export class IntentController {
  private readonly logger = new Logger(IntentController.name);

  constructor(
    private readonly intentService: IntentService,
    private readonly utility: IntentUtility,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() createIntentDto: CreateIntentDto) {
    this.logger.log(`Received POST /intent for user ${createIntentDto.userId}`);
    return this.intentService.processIntent(createIntentDto);
  }

  @Get('message')
  async getMessage(@Query() query: GetMessageDto) {
    this.logger.log(`Received GET /intent/message. Query: ${JSON.stringify(query)}`);
    
    // Generate a fixed timestamp for this signature request
    const timestamp = Date.now().toString();
    
    const message = this.utility.createSignableMessage({
        ...query,
        timestamp,
    });

    this.logger.log(`Generated message: ${message}`);

    return {
      message: message,
      timestamp: timestamp, // Return it so frontend can send it back in POST
    };
  }
}
