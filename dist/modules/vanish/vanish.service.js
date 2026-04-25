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
    LOAN_SOL = '12000000';
    JITO_TIP = '1000000';
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.apiUrl = this.configService.getOrThrow('VANISH_API_URL');
        this.apiKey = this.configService.getOrThrow('VANISH_API_KEY');
    }
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
        };
    }
    async checkHealth() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.apiUrl}/health`, {
                headers: this.getHeaders(),
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Health check failed: ${error.message}`);
            throw error;
        }
    }
    async getOneTimeWallet() {
        try {
            this.logger.log('Vanish: Requesting OTW...');
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.apiUrl}/trade/one-time-wallet`, {
                headers: this.getHeaders(),
            }));
            return response.data.address;
        }
        catch (error) {
            this.logger.error(`Failed to get OTW: ${error.message}`);
            throw error;
        }
    }
    async createTrade(payload) {
        try {
            this.logger.log(`Vanish: Sending Trade Create Payload: ${JSON.stringify(payload)}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/trade/create`, {
                ...payload,
                loan_additional_sol: this.LOAN_SOL,
                jito_tip_amount: this.JITO_TIP,
                split_repay: 1,
            }, {
                headers: this.getHeaders(),
            }));
            return response.data;
        }
        catch (error) {
            if (error.response) {
                this.logger.error(`Vanish Trade Create Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }
    async commitAction(tx_id) {
        try {
            this.logger.log(`Vanish: Committing TX ${tx_id}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/commit`, { tx_id }, {
                headers: this.getHeaders(),
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Commit failed: ${error.message}`);
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