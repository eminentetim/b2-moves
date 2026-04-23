export declare class GetMessageDto {
    userId: string;
    nonce: string;
    publicKey: string;
    inputToken?: string;
    outputToken?: string;
    amount?: number;
    slippage?: number;
    action?: string;
    timestamp?: string;
    messageId?: number;
}
