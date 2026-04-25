export declare class IntentUtility {
    private readonly LOAN_SOL;
    private readonly JITO_TIP;
    private readonly TOS_PREFIX;
    createVanishTradeMessage(data: {
        source_token_address: string;
        target_token_address: string;
        amount: string;
        timestamp: string;
    }): string;
    createSignableMessage(intentData: any): string;
}
