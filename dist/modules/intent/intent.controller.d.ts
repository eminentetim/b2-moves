import { IntentService } from './intent.service';
import { IntentUtility } from './intent.utility';
import { CreateIntentDto } from './dto/create-intent.dto';
export declare class IntentController {
    private readonly intentService;
    private readonly utility;
    constructor(intentService: IntentService, utility: IntentUtility);
    create(createIntentDto: CreateIntentDto): Promise<{
        status: string;
        intentId: string;
        message: string;
        nonce: string;
    }>;
    getMessage(query: any): Promise<{
        message: string;
    }>;
}
