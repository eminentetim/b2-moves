"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingController = void 0;
const common_1 = require("@nestjs/common");
const trading_service_1 = require("./trading.service");
const trading_dto_1 = require("./dto/trading.dto");
let TradingController = class TradingController {
    tradingService;
    constructor(tradingService) {
        this.tradingService = tradingService;
    }
    createLimitOrder(dto) {
        return this.tradingService.createLimitOrder(dto);
    }
    createDcaOrder(dto) {
        return this.tradingService.createDcaOrder(dto);
    }
    updatePositionProtection(dto) {
        return this.tradingService.updatePositionProtection(dto);
    }
    getActiveLimitOrders(userId) {
        return this.tradingService.getActiveLimitOrders(userId);
    }
    getActiveDcaOrders(userId) {
        return this.tradingService.getActiveDcaOrders(userId);
    }
    getUserPositions(userId) {
        return this.tradingService.getUserPositions(userId);
    }
    cancelLimitOrder(id) {
        return this.tradingService.cancelLimitOrder(id);
    }
};
exports.TradingController = TradingController;
__decorate([
    (0, common_1.Post)('limit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trading_dto_1.CreateLimitOrderDto]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "createLimitOrder", null);
__decorate([
    (0, common_1.Post)('dca'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trading_dto_1.CreateDcaOrderDto]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "createDcaOrder", null);
__decorate([
    (0, common_1.Post)('position/protection'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [trading_dto_1.UpdatePositionDto]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "updatePositionProtection", null);
__decorate([
    (0, common_1.Get)('limit/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "getActiveLimitOrders", null);
__decorate([
    (0, common_1.Get)('dca/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "getActiveDcaOrders", null);
__decorate([
    (0, common_1.Get)('positions/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "getUserPositions", null);
__decorate([
    (0, common_1.Delete)('limit/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TradingController.prototype, "cancelLimitOrder", null);
exports.TradingController = TradingController = __decorate([
    (0, common_1.Controller)('trading'),
    __metadata("design:paramtypes", [trading_service_1.TradingService])
], TradingController);
//# sourceMappingURL=trading.controller.js.map