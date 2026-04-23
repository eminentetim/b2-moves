import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VanishService {
  private readonly logger = new Logger(VanishService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('VANISH_API_URL');
    this.apiKey = this.configService.getOrThrow<string>('VANISH_API_KEY');
  }

  async checkHealth() {
    try {
      this.logger.log('Checking Vanish API health...');
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/health`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  /**
   * Step 1: Fetch a disposable One-Time Wallet (OTW) for the trade.
   */
  async getOneTimeWallet() {
    try {
      this.logger.log('Requesting One-Time Wallet from Vanish...');
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/trade/one-time-wallet`, {
          headers: { 'x-api-key': this.apiKey },
        }),
      );
      return response.data.address;
    } catch (error) {
      this.logger.error(`Failed to get OTW: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  /**
   * Step 2: Create a private trade with user's signature.
   */
  async createTrade(payload: {
    user_address: string;
    source_token_address: string;
    target_token_address: string;
    amount: string;
    swap_transaction: string;
    one_time_wallet: string;
    user_signature: string;
    timestamp: string;
  }) {
    try {
      this.logger.log(`Creating private trade for user: ${payload.user_address}`);
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/trade/create`,
          {
            ...payload,
            loan_additional_sol: '12000000', // 0.012 SOL to cover ATAs
            jito_tip_amount: '1000000',    // 0.001 SOL
            split_repay: 1,                // Direct delivery
          },
          {
            headers: { 'x-api-key': this.apiKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Trade creation failed: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  /**
   * Step 3: Resolve the user's balance and final status.
   */
  async commitAction(tx_id: string) {
    try {
      this.logger.log(`Committing transaction: ${tx_id}`);
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/commit`,
          { tx_id },
          {
            headers: { 'x-api-key': this.apiKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Commit failed: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  /**
   * Helper: Formats the message required for the Vanish "Trade Signature".
   */
  generateVanishSignMessage(data: {
    user_address: string;
    source_token_address: string;
    target_token_address: string;
    amount: string;
    timestamp: string;
  }): string {
    return `Details: trade:${data.user_address},${data.source_token_address},${data.target_token_address},${data.amount},${data.timestamp}`;
  }
}
