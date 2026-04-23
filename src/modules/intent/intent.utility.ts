import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentUtility {
  /**
   * Creates the exact string required by Vanish Core for private trades.
   * Format: Details: trade:<user>,<in>,<out>,<amount>,<timestamp>
   */
  createVanishTradeMessage(data: {
    user_address: string;
    source_token_address: string;
    target_token_address: string;
    amount: string;
    timestamp: string;
  }): string {
    return `Details: trade:${data.user_address},${data.source_token_address},${data.target_token_address},${data.amount},${data.timestamp}`;
  }

  /**
   * Standard deterministic message for non-swap actions (like Linking).
   */
  createSignableMessage(intentData: any): string {
    const { signature, publicKey, messageId, timestamp, ...data } = intentData;
    
    // If it's a swap intent, we use the Vanish format
    if (data.inputToken && data.outputToken && data.amount && timestamp) {
        return this.createVanishTradeMessage({
            user_address: publicKey,
            source_token_address: data.inputToken === 'SOL' ? '11111111111111111111111111111111' : data.inputToken,
            target_token_address: data.outputToken,
            amount: (data.amount * 10**9).toString(),
            timestamp: timestamp.toString(),
        });
    }

    // Default sorting for other metadata
    const sortedData = Object.keys(data)
      .sort()
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    return JSON.stringify(sortedData);
  }
}
