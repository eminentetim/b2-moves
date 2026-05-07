export declare class GetMessageDto {
    userId: string;
    nonce: string;
    publicKey: string;
    inputToken?: string;
    outputToken?: string;
    amount?: number;
    slippage?: number;
    action?: string;
    intentId?: string;
    timestamp?: string;
    messageId?: number;
    amountIn?: number;
    triggerPrice?: number;
    fromToken?: string;
    toToken?: string;
    frequency?: string;
    tokenMint?: string;
    takeProfitPrice?: number;
    stopLossPrice?: number;
}
