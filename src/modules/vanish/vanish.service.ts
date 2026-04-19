import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VanishService {
  private readonly logger = new Logger(VanishService.name);
  private readonly apiUrl: string | undefined;
  private readonly apiKey: string | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('VANISH_API_URL');
    this.apiKey = this.configService.get<string>('VANISH_API_KEY');
  }

  async getPrivateRoute(inputToken: string, outputToken: string, amount: number) {
    try {
      this.logger.log(`Requesting private route from Vanish for ${amount} ${inputToken}`);
      
      // If API URL is not set, we use a mock for development
      if (!this.apiUrl) {
        this.logger.warn('VANISH_API_URL not set, returning mock private route');
        return {
          routeId: `vanish_${Math.random().toString(36).substring(7)}`,
          hops: 3,
          estimatedLatency: '180ms',
          privacyScore: 0.99
        };
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/routes`, {
          inputToken,
          outputToken,
          amount,
        }, {
          headers: { 'X-API-KEY': this.apiKey }
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to fetch Vanish route: ${error.message}`);
      throw error;
    }
  }

  async executePrivateSwap(swapTransaction: any, privateRoute: any) {
    try {
      this.logger.log(`Executing private swap via Vanish route: ${privateRoute.routeId}`);
      
      if (!this.apiUrl) {
        this.logger.warn('VANISH_API_URL not set, simulating private execution');
        return {
          txId: `ghost_${Math.random().toString(36).substring(2, 15)}`,
          status: 'stealth_confirmed',
          outputWallet: 'unlinked_address_generated'
        };
      }

      const response = await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/execute`, {
          swapTransaction,
          routeId: privateRoute.routeId,
        }, {
          headers: { 'X-API-KEY': this.apiKey }
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Private execution failed: ${error.message}`);
      throw error;
    }
  }
}
