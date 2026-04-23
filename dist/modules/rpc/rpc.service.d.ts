import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Transaction } from '@solana/web3.js';
export declare class RpcService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private connections;
    private commitment;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    getConnection(): Connection;
    getBalance(publicKey: string): Promise<number>;
    getLatestBlockhash(): Promise<Readonly<{
        blockhash: import("@solana/web3.js").Blockhash;
        lastValidBlockHeight: number;
    }>>;
    simulateTransaction(transaction: Transaction): Promise<import("@solana/web3.js").RpcResponseAndContext<import("@solana/web3.js").SimulatedTransactionResponse>>;
}
