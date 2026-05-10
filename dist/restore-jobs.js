"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const prisma_service_1 = require("./src/database/prisma/prisma.service");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
        const prisma = app.get(prisma_service_1.PrismaService);
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
    }
    catch (err) {
        console.error('Failed to restore orders:', err.message);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=restore-jobs.js.map