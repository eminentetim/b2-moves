import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PrismaService } from './src/database/prisma/prisma.service';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    console.log('Restoring automated orders to ACTIVE...');
    
    const dca = await prisma.dcaOrder.updateMany({
      where: { status: 'PAUSED' },
      data: { status: 'ACTIVE' }
    });
    console.log(`   Restored ${dca.count} DCA orders.`);

    const limits = await prisma.limitOrder.updateMany({
      where: { status: 'CANCELLED' },
      data: { status: 'ACTIVE' }
    });
    console.log(`   Restored ${limits.count} Limit orders.`);

    await app.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to restore orders:', err.message);
    process.exit(1);
  }
}
bootstrap();
