import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Controller('rebalance')
export class RebalanceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getRebalanceIntent(@Param('id') id: string) {
    const intent = await this.prisma.rebalanceIntent.findUnique({
      where: { id },
      include: { chunks: true }
    });

    if (!intent) {
      throw new NotFoundException('Rebalance intent not found');
    }

    return intent;
  }
}
