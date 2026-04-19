import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentUtility {
  /**
   * Creates a deterministic JSON string from intent data.
   * This is what the user must sign in the frontend.
   */
  createSignableMessage(intentData: any): string {
    const { signature, publicKey, ...data } = intentData;
    
    // Sort keys to ensure deterministic stringification across different platforms
    const sortedData = Object.keys(data)
      .sort()
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    return JSON.stringify(sortedData);
  }
}
