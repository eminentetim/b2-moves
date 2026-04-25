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
let IntentUtility = class IntentUtility {
    LOAN_SOL = '12000000';
    JITO_TIP = '1000000';
    TOS_PREFIX = "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\n";
    createVanishTradeMessage(data) {
        const details = `Details: trade:${data.source_token_address}:${data.target_token_address}:${data.amount}:${this.LOAN_SOL}:${data.timestamp}:${this.JITO_TIP}`;
        return this.TOS_PREFIX + details;
    }
    createSignableMessage(intentData) {
        const { signature, publicKey, messageId, timestamp, ...data } = intentData;
        if (data.inputToken && data.outputToken && data.amount && timestamp) {
            const normalize = (mint) => {
                if (mint === 'SOL' || mint === 'So11111111111111111111111111111111111111112') {
                    return '11111111111111111111111111111111';
                }
                return mint;
            };
            const source = normalize(data.inputToken);
            const target = normalize(data.outputToken);
            const isSol = source === '11111111111111111111111111111111';
            const decimals = isSol ? 9 : 6;
            const rawAmount = Math.floor(data.amount * Math.pow(10, decimals)).toString();
            return this.createVanishTradeMessage({
                source_token_address: source,
                target_token_address: target,
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
};
exports.IntentUtility = IntentUtility;
exports.IntentUtility = IntentUtility = __decorate([
    (0, common_1.Injectable)()
], IntentUtility);
//# sourceMappingURL=intent.utility.js.map