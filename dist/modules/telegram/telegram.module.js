"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramModule = void 0;
const common_1 = require("@nestjs/common");
const telegram_service_1 = require("./telegram.service");
const telegram_update_1 = require("./telegram.update");
const swap_wizard_1 = require("./swap.wizard");
const onboarding_wizard_1 = require("./onboarding.wizard");
const rpc_module_1 = require("../rpc/rpc.module");
let TelegramModule = class TelegramModule {
};
exports.TelegramModule = TelegramModule;
exports.TelegramModule = TelegramModule = __decorate([
    (0, common_1.Module)({
        imports: [rpc_module_1.RpcModule],
        providers: [telegram_service_1.TelegramService, telegram_update_1.TelegramUpdate, swap_wizard_1.SwapWizard, onboarding_wizard_1.OnboardingWizard],
        exports: [telegram_service_1.TelegramService],
    })
], TelegramModule);
//# sourceMappingURL=telegram.module.js.map