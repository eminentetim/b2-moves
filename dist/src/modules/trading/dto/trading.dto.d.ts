export declare class CreateLimitOrderDto {
    inputToken: string;
    outputToken: string;
    amountIn: number;
    triggerPrice: number;
    userId: string;
}
export declare class CreateDcaOrderDto {
    fromToken: string;
    toToken: string;
    amount: number;
    frequency: string;
    userId: string;
}
export declare class UpdatePositionDto {
    tokenMint: string;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    userId: string;
}
