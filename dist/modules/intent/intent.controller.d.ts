import { IntentService } from './intent.service';
import { IntentUtility } from './intent.utility';
import { CreateIntentDto } from './dto/create-intent.dto';
export declare class IntentController {
    private readonly intentService;
    private readonly utility;
    private readonly logger;
    constructor(intentService: IntentService, utility: IntentUtility);
    create(createIntentDto: CreateIntentDto): Promise<{
        status: string;
        message: string;
        intentId?: undefined;
        nonce?: undefined;
    } | {
        status: string;
        intentId: string;
        message: string;
        nonce: string;
    }>;
    getMessage(query: any): Promise<{
        message: string;
        timestamp: any;
        error?: undefined;
    } | {
        message: string;
        timestamp: string;
        error: any;
    }>;
}
