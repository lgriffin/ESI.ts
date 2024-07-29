import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterAffiliationApi {
    constructor(private client: ApiClient) {}
// Need to double check if auth is not needed here, was initiatlly true but now setting to false
    async postCharacterAffiliation(body: any): Promise<any> {
        return handleRequest(this.client, `characters/affiliation`, 'POST', JSON.stringify(body), false);
    }
}
