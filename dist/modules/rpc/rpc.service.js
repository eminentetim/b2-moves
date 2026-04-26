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
var RpcService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RpcService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web3_js_1 = require("@solana/web3.js");
let RpcService = RpcService_1 = class RpcService {
    configService;
    logger = new common_1.Logger(RpcService_1.name);
    connections = [];
    commitment;
    constructor(configService) {
        this.configService = configService;
        this.commitment = this.configService.get('SOLANA_COMMITMENT') || 'confirmed';
    }
    onModuleInit() {
        const urls = [
            'https://api.devnet.solana.com',
            this.configService.get('SOLANA_QUICKNODE_RPC'),
            this.configService.get('SOLANA_RPC_URL'),
            'https://api.mainnet-beta.solana.com'
        ].filter(url => !!url);
        const uniqueUrls = [...new Set(urls)];
        this.connections = uniqueUrls.map(url => new web3_js_1.Connection(url, this.commitment));
        this.logger.log(`RPC Manager Initialized with ${this.connections.length} redundant endpoints.`);
    }
    getConnection() {
        return this.connections[0];
    }
    async getTokensForWallet(publicKey) {
        try {
            const pubkey = new web3_js_1.PublicKey(publicKey);
            const accounts = await this.getConnection().getParsedTokenAccountsByOwner(pubkey, {
                programId: new web3_js_1.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
            });
            return accounts.value
                .map((account) => {
                const info = account.account.data.parsed.info;
                return {
                    mint: info.mint,
                    amount: info.tokenAmount.uiAmount,
                    decimals: info.tokenAmount.decimals,
                };
            })
                .filter((t) => t.amount > 0);
        }
        catch (error) {
            this.logger.error(`Failed to fetch tokens: ${error.message}`);
            return [];
        }
    }
    async getBalance(publicKey) {
        for (const conn of this.connections) {
            try {
                const balance = await conn.getBalance(new web3_js_1.PublicKey(publicKey));
                return balance / 10 ** 9;
            }
            catch (error) {
                this.logger.warn(`RPC Failover: Attempting next provider after error: ${error.message}`);
            }
        }
        throw new Error('All RPC providers failed to fetch balance.');
    }
    async getLatestBlockhash() {
        return this.getConnection().getLatestBlockhash(this.commitment);
    }
    async simulateTransaction(transaction) {
        this.logger.log(`Simulating transaction across primary RPC...`);
        const simulation = await this.getConnection().simulateTransaction(transaction);
        if (simulation.value.err) {
            this.logger.error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
            throw new Error(`Transaction simulation failed`);
        }
        return simulation;
    }
};
exports.RpcService = RpcService;
exports.RpcService = RpcService = RpcService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RpcService);
//# sourceMappingURL=rpc.service.js.map