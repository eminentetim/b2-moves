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
    createVanishTradeMessage(data) {
        return `Details: trade:${data.user_address},${data.source_token_address},${data.target_token_address},${data.amount},${data.timestamp}`;
    }
    createSignableMessage(intentData) {
        const { signature, publicKey, messageId, timestamp, ...data } = intentData;
        if (data.inputToken && data.outputToken && data.amount && timestamp) {
            return this.createVanishTradeMessage({
                user_address: publicKey,
                source_token_address: data.inputToken === 'SOL' ? '11111111111111111111111111111111' : data.inputToken,
                target_token_address: data.outputToken,
                amount: (data.amount * 10 ** 9).toString(),
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