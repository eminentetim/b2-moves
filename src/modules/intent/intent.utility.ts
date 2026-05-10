import { Injectable } from '@nestjs/common';
import { TOKENS } from '../../common/constants/tokens';

@Injectable()
export class IntentUtility {
  // Protocol Constants from Vanish docs
  private readonly LOAN_SOL = '12000000'; // 0.012 SOL
  private readonly JITO_TIP = '1000000';  // 0.001 SOL
  private readonly TOS_PREFIX = "By signing, I hereby agree to Vanish's Terms of Service and agree to be bound by them (docs.vanish.trade/legal/TOS)";

  /**
   * Creates the exact string required by Vanish Core for private trades.
   */
  createVanishTradeMessage(data: {
    source_token_address: string;
    target_token_address: string;
    amount: string;
    timestamp: string;
  }): string {
    // Official multi-line format: ToS + Empty Line + Details
    const details = `Details: trade:${data.source_token_address}:${data.target_token_address}:${data.amount}:${this.LOAN_SOL}:${data.timestamp}:${this.JITO_TIP}`;
    return this.TOS_PREFIX + "\n\n" + details;
  }

  /**
   * Standard deterministic message for non-swap actions (like Linking).
   */
  createSignableMessage(intentData: any): string {
    const { signature, publicKey, messageId, timestamp, ...data } = intentData;
    
    // If it's a swap intent, we use the STRICT Vanish format
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

  private resolveAndNormalize(token: string): string {
      const trimmed = token.trim();
      
      // 1. Resolve Symbol to Mint
      let mint = trimmed;
      if (trimmed === 'SOL') mint = TOKENS.SOL;
      else if (trimmed === 'USDC') mint = TOKENS.USDC_MAINNET;
      else if (trimmed === 'USDT') mint = TOKENS.USDT_MAINNET;
      else if (trimmed === 'BONK') mint = TOKENS.BONK;

      // 2. Normalize SOL for Vanish (32 ones)
      if (mint === TOKENS.SOL) {
          return '11111111111111111111111111111111';
      }
      
      return mint;
  }

  private getDecimals(mint: string): number {
      if (mint === '11111111111111111111111111111111') return 9;
      if (mint === TOKENS.USDC_MAINNET || mint === TOKENS.USDT_MAINNET) return 6;
      if (mint === TOKENS.BONK) return 5;
      return 6; // Default fallback
  }
}
