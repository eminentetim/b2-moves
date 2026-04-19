import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey, Commitment, Transaction } from '@solana/web3.js';

@Injectable()
export class RpcService implements OnModuleInit {
  private readonly logger = new Logger(RpcService.name);
  private connection: Connection;
  private backupConnection: Connection | null = null;
  private commitment: Commitment;

  constructor(private readonly configService: ConfigService) {
    this.commitment = (this.configService.get<string>('SOLANA_COMMITMENT') as Commitment) || 'confirmed';
  }

  onModuleInit() {
    const mainRpc = this.configService.get<string>('SOLANA_HELIUS_RPC') || 
                    this.configService.get<string>('SOLANA_RPC_URL') ||
                    'https://api.mainnet-beta.solana.com';
    const backupRpc = this.configService.get<string>('SOLANA_QUICKNODE_RPC');

    this.connection = new Connection(mainRpc, this.commitment);
    if (backupRpc) {
      this.backupConnection = new Connection(backupRpc, this.commitment);
      this.logger.log(`RPC Initialized: Helius (Main), QuickNode (Backup)`);
    } else {
      this.logger.log(`RPC Initialized: ${mainRpc}`);
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  async getBalance(publicKey: string): Promise<number> {
    try {
      const balance = await this.connection.getBalance(new PublicKey(publicKey));
      return balance / 10**9; // Return in SOL
    } catch (error) {
      this.logger.error(`Failed to get balance from primary RPC, retrying with backup...`);
      if (this.backupConnection) {
        const balance = await this.backupConnection.getBalance(new PublicKey(publicKey));
        return balance / 10**9;
      }
      throw error;
    }
  }

  async getLatestBlockhash() {
    return this.connection.getLatestBlockhash(this.commitment);
  }

  async simulateTransaction(transaction: Transaction) {
    this.logger.log(`Simulating transaction...`);
    const simulation = await this.connection.simulateTransaction(transaction);
    if (simulation.value.err) {
      this.logger.error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
      throw new Error(`Transaction simulation failed`);
    }
    return simulation;
  }

  async confirmTransaction(signature: string) {
    this.logger.log(`Confirming transaction: ${signature}`);
    const latestBlockhash = await this.getLatestBlockhash();
    return this.connection.confirmTransaction({
      signature,
      ...latestBlockhash
    }, this.commitment);
  }
}
