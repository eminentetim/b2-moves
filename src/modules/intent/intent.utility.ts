import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentUtility {
  // Protocol Constants from Vanish docs
  private readonly LOAN_SOL = '12000000'; // 0.012 SOL
  private readonly JITO_TIP = '1000000';  // 0.001 SOL
  private readonly TOS_PREFIX = "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)\n\n";

  /**
   * Creates the exact string required by Vanish Core for private trades.
   */
  createVanishTradeMessage(data: {
    source_token_address: string;
    target_token_address: string;
    amount: string;
    timestamp: string;
  }): string {
    const details = `Details: trade:${data.source_token_address}:${data.target_token_address}:${data.amount}:${this.LOAN_SOL}:${data.timestamp}:${this.JITO_TIP}`;
    return this.TOS_PREFIX + details;
  }

  /**
   * Standard deterministic message for non-swap actions (like Linking).
   */
  createSignableMessage(intentData: any): string {
    const { signature, publicKey, messageId, timestamp, ...data } = intentData;
    
    // If it's a swap intent, we use the STRICT Vanish format
    if (data.inputToken && data.outputToken && data.amount && timestamp) {
        // SOL ADDRESS NORMALIZATION (Force 32 ones for Vanish signature)
        const normalize = (mint: string) => {
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
}
