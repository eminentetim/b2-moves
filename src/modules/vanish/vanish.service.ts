import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VanishService {
  private readonly logger = new Logger(VanishService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  // Protocol Constants - MUST match IntentUtility
  private readonly LOAN_SOL = '12000000';
  private readonly JITO_TIP = '1000000';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.getOrThrow<string>('VANISH_API_URL');
    this.apiKey = this.configService.getOrThrow<string>('VANISH_API_KEY');
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
    };
  }

  async checkHealth() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/health`, {
          headers: this.getHeaders(),
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      throw error;
    }
  }

  async getOneTimeWallet() {
    try {
      this.logger.log('Vanish: Requesting OTW...');
      const response = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/trade/one-time-wallet`, {
          headers: this.getHeaders(),
        }),
      );
      return response.data.address;
    } catch (error) {
      this.logger.error(`Failed to get OTW: ${error.message}`);
      throw error;
    }
  }

  async createTrade(payload: any) {
    try {
      this.logger.log(`Vanish: Sending Trade Create Payload: ${JSON.stringify(payload)}`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/trade/create`,
          {
            ...payload,
            loan_additional_sol: this.LOAN_SOL, // Use constant
            jito_tip_amount: this.JITO_TIP,     // Use constant
            split_repay: 1,
          },
          {
            headers: this.getHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error) {
      if (error.response) {
          this.logger.error(`Vanish Trade Create Error [${error.response.status}]: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  async commitAction(tx_id: string) {
    try {
      this.logger.log(`Vanish: Committing TX ${tx_id}`);
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/commit`,
          { tx_id },
          {
            headers: this.getHeaders(),
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Commit failed: ${error.message}`);
      throw error;
    }
  }
}
