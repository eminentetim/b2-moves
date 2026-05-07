import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { TradingService } from './trading.service';
import { CreateLimitOrderDto, CreateDcaOrderDto, UpdatePositionDto } from './dto/trading.dto';

@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Post('limit')
  createLimitOrder(@Body() dto: CreateLimitOrderDto) {
    return this.tradingService.createLimitOrder(dto);
  }

  @Post('dca')
  createDcaOrder(@Body() dto: CreateDcaOrderDto) {
    return this.tradingService.createDcaOrder(dto);
  }

  @Post('position/protection')
  updatePositionProtection(@Body() dto: UpdatePositionDto) {
    return this.tradingService.updatePositionProtection(dto);
  }

  @Get('limit/:userId')
  getActiveLimitOrders(@Param('userId') userId: string) {
    return this.tradingService.getActiveLimitOrders(userId);
  }

  @Get('dca/:userId')
  getActiveDcaOrders(@Param('userId') userId: string) {
    return this.tradingService.getActiveDcaOrders(userId);
  }

  @Get('positions/:userId')
  getUserPositions(@Param('userId') userId: string) {
    return this.tradingService.getUserPositions(userId);
  }

  @Delete('limit/:id')
  cancelLimitOrder(@Param('id') id: string) {
    return this.tradingService.cancelLimitOrder(id);
  }
}
