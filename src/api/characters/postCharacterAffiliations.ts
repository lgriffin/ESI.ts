import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterAffiliationApi {
    constructor(private client: ApiClient) {}

    async postCharacterAffiliation(body: any): Promise<any> {
        return handleRequest(this.client, `characters/affiliation`, 'POST', JSON.stringify(body), true);
    }
}
