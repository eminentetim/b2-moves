export declare class CreateIntentDto {
    userId: string;
    inputToken?: string;
    outputToken?: string;
    amount?: number;
    slippage?: number;
    deadline?: number;
    nonce: string;
    signature: string;
    publicKey: string;
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
