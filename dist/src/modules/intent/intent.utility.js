"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentUtility = void 0;
const common_1 = require("@nestjs/common");
const tokens_1 = require("../../common/constants/tokens");
let IntentUtility = class IntentUtility {
    LOAN_SOL = '12000000';
    JITO_TIP = '1000000';
    TOS_PREFIX = "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)";
    createVanishTradeMessage(data) {
        const details = `Details: trade:${data.source_token_address}:${data.target_token_address}:${data.amount}:${this.LOAN_SOL}:${data.timestamp}:${this.JITO_TIP}`;
        return this.TOS_PREFIX + "\n\n" + details;
    }
    createSignableMessage(intentData) {
        const { signature, publicKey, messageId, timestamp, ...data } = intentData;
        if (data.inputToken && data.outputToken && data.amount && timestamp) {
            const sourceMint = this.resolveAndNormalize(data.inputToken);
            const targetMint = this.resolveAndNormalize(data.outputToken);
            const decimals = this.getDecimals(sourceMint);
            const rawAmount = Math.floor(data.amount * Math.pow(10, decimals)).toString();
            return this.createVanishTradeMessage({
                source_token_address: sourceMint,
                target_token_address: targetMint,
                amount: rawAmount,
                timestamp: timestamp.toString(),
            });
        }
        const sortedData = Object.keys(data)
            .sort()
            .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
        return JSON.stringify(sortedData);
    }
    resolveAndNormalize(token) {
        const trimmed = token.trim();
        let mint = trimmed;
        if (trimmed === 'SOL')
            mint = tokens_1.TOKENS.SOL;
        else if (trimmed === 'USDC')
            mint = tokens_1.TOKENS.USDC_MAINNET;
        else if (trimmed === 'USDT')
            mint = tokens_1.TOKENS.USDT_MAINNET;
        else if (trimmed === 'BONK')
            mint = tokens_1.TOKENS.BONK;
        if (mint === tokens_1.TOKENS.SOL) {
            return '11111111111111111111111111111111';
        }
        return mint;
    }
    getDecimals(mint) {
        if (mint === '11111111111111111111111111111111')
            return 9;
        if (mint === tokens_1.TOKENS.USDC_MAINNET || mint === tokens_1.TOKENS.USDT_MAINNET)
            return 6;
        if (mint === tokens_1.TOKENS.BONK)
            return 5;
        return 6;
    }
};
exports.IntentUtility = IntentUtility;
exports.IntentUtility = IntentUtility = __decorate([
    (0, common_1.Injectable)()
], IntentUtility);
//# sourceMappingURL=intent.utility.js.map