import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterOpportunitiesApi {
    constructor(private client: ApiClient) {}

    async getCharacterOpportunities(characterId: number): Promise<any> {
        return await handleRequest(this.client, `characters/${characterId}/opportunities`, 'GET', undefined, true);
    }
}
