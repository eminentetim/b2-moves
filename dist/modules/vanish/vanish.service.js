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
var VanishService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VanishService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let VanishService = VanishService_1 = class VanishService {
    httpService;
    configService;
    logger = new common_1.Logger(VanishService_1.name);
    apiUrl;
    apiKey;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.apiUrl = this.configService.get('VANISH_API_URL');
        this.apiKey = this.configService.get('VANISH_API_KEY');
    }
    async getPrivateRoute(inputToken, outputToken, amount) {
        try {
            this.logger.log(`Requesting private route from Vanish for ${amount} ${inputToken}`);
            if (!this.apiUrl) {
                this.logger.warn('VANISH_API_URL not set, returning mock private route');
                return {
                    routeId: `vanish_${Math.random().toString(36).substring(7)}`,
                    hops: 3,
                    estimatedLatency: '180ms',
                    privacyScore: 0.99
                };
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/routes`, {
                inputToken,
                outputToken,
                amount,
            }, {
                headers: { 'X-API-KEY': this.apiKey }
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch Vanish route: ${error.message}`);
            throw error;
        }
    }
    async executePrivateSwap(swapTransaction, privateRoute) {
        try {
            this.logger.log(`Executing private swap via Vanish route: ${privateRoute.routeId}`);
            if (!this.apiUrl) {
                this.logger.warn('VANISH_API_URL not set, simulating private execution');
                return {
                    txId: `ghost_${Math.random().toString(36).substring(2, 15)}`,
                    status: 'stealth_confirmed',
                    outputWallet: 'unlinked_address_generated'
                };
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/execute`, {
                swapTransaction,
                routeId: privateRoute.routeId,
            }, {
                headers: { 'X-API-KEY': this.apiKey }
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Private execution failed: ${error.message}`);
            throw error;
        }
    }
};
exports.VanishService = VanishService;
exports.VanishService = VanishService = VanishService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], VanishService);
//# sourceMappingURL=vanish.service.js.map