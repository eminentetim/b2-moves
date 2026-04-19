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
var JupiterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JupiterService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let JupiterService = JupiterService_1 = class JupiterService {
    httpService;
    configService;
    logger = new common_1.Logger(JupiterService_1.name);
    apiUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.apiUrl = this.configService.get('JUPITER_API_URL', 'https://quote-api.jup.ag/v6');
    }
    async getQuote(inputMint, outputMint, amount, slippageBps = 50) {
        try {
            this.logger.log(`Fetching quote: ${amount} ${inputMint} -> ${outputMint}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.apiUrl}/quote`, {
                params: {
                    inputMint,
                    outputMint,
                    amount,
                    slippageBps,
                },
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to fetch quote: ${error.message}`);
            throw error;
        }
    }
    async getSwapTransaction(quoteResponse, userPublicKey) {
        try {
            this.logger.log(`Requesting swap transaction for user: ${userPublicKey}`);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.apiUrl}/swap`, {
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol: true,
            }));
            return response.data;
        }
        catch (error) {
            this.logger.error(`Failed to get swap transaction: ${error.message}`);
            throw error;
        }
    }
};
exports.JupiterService = JupiterService;
exports.JupiterService = JupiterService = JupiterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], JupiterService);
//# sourceMappingURL=jupiter.service.js.map