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
exports.RebalanceController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma/prisma.service");
let RebalanceController = class RebalanceController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRebalanceIntent(id) {
        const intent = await this.prisma.rebalanceIntent.findUnique({
            where: { id },
            include: { chunks: true }
        });
        if (!intent) {
            throw new common_1.NotFoundException('Rebalance intent not found');
        }
        return intent;
    }
};
exports.RebalanceController = RebalanceController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RebalanceController.prototype, "getRebalanceIntent", null);
exports.RebalanceController = RebalanceController = __decorate([
    (0, common_1.Controller)('rebalance'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RebalanceController);
//# sourceMappingURL=rebalance.controller.js.map