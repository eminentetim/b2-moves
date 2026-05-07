"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const trading_service_1 = require("./trading.service");
const trading_controller_1 = require("./trading.controller");
const trading_processor_1 = require("./trading.processor");
const jupiter_module_1 = require("../jupiter/jupiter.module");
const orchestrator_module_1 = require("../orchestrator/orchestrator.module");
const prisma_module_1 = require("../../database/prisma/prisma.module");
let TradingModule = class TradingModule {
};
exports.TradingModule = TradingModule;
exports.TradingModule = TradingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            jupiter_module_1.JupiterModule,
            orchestrator_module_1.OrchestratorModule,
        ],
        controllers: [trading_controller_1.TradingController],
        providers: [trading_service_1.TradingService, trading_processor_1.TradingProcessor],
        exports: [trading_service_1.TradingService],
    })
], TradingModule);
//# sourceMappingURL=trading.module.js.map