export declare class IntentUtility {
    createVanishTradeMessage(data: {
        user_address: string;
        source_token_address: string;
        target_token_address: string;
        amount: string;
        timestamp: string;
    }): string;
    createSignableMessage(intentData: any): string;
}
