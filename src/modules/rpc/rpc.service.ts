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
      'https://api.devnet.solana.com', // Priority #1 for testing
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

  async getTokensForWallet(publicKey: string): Promise<any[]> {
    try {
      const pubkey = new PublicKey(publicKey);
      const accounts = await this.getConnection().getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      });

      return accounts.value
        .map((account) => {
          const info = account.account.data.parsed.info;
          return {
            mint: info.mint,
            amount: info.tokenAmount.uiAmount,
            decimals: info.tokenAmount.decimals,
          };
        })
        .filter((t) => t.amount > 0);
    } catch (error) {
      this.logger.error(`Failed to fetch tokens: ${error.message}`);
      return [];
    }
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
