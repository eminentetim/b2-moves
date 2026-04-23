import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, Commitment, Transaction } from '@solana/web3.js';

@Injectable()
export class RpcService implements OnModuleInit {
  private readonly logger = new Logger(RpcService.name);
  private connections: Connection[] = [];
  private commitment: Commitment;

  constructor(private readonly configService: ConfigService) {
    this.commitment = (this.configService.get<string>('SOLANA_COMMITMENT') as Commitment) || 'confirmed';
  }

  onModuleInit() {
    const urls = [
      this.configService.get<string>('HELIUS_GATEKEEPER_RPC'),
      this.configService.get<string>('HELIUS_STANDARD_RPC'),
      this.configService.get<string>('SOLANA_QUICKNODE_RPC'),
      this.configService.get<string>('SOLANA_RPC_URL'),
      'https://api.mainnet-beta.solana.com'
    ].filter(url => !!url) as string[];

    // Remove duplicates and initialize connections
    const uniqueUrls = [...new Set(urls)];
    this.connections = uniqueUrls.map(url => new Connection(url, this.commitment));
    
    this.logger.log(`RPC Manager Initialized with ${this.connections.length} redundant endpoints.`);
  }

  /**
   * Returns the primary (healthiest/first) connection.
   */
  getConnection(): Connection {
    return this.connections[0];
  }

  /**
   * Robust balance check with multi-tier failover.
   */
  async getBalance(publicKey: string): Promise<number> {
    for (const conn of this.connections) {
      try {
        const balance = await conn.getBalance(new PublicKey(publicKey));
        return balance / 10**9;
      } catch (error) {
        this.logger.warn(`RPC Failover: Attempting next provider after error: ${error.message}`);
      }
    }
    throw new Error('All RPC providers failed to fetch balance.');
  }

  async getLatestBlockhash() {
    return this.getConnection().getLatestBlockhash(this.commitment);
  }

  async simulateTransaction(transaction: Transaction) {
    this.logger.log(`Simulating transaction across primary RPC...`);
    const simulation = await this.getConnection().simulateTransaction(transaction);
    if (simulation.value.err) {
      this.logger.error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      throw new Error(`Transaction simulation failed`);
    }
    return simulation;
  }
}
