import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetAgentsResearchApi {
    constructor(private client: ApiClient) {}

    async getAgentsResearch(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/agents_research/`, 'GET', undefined, true);
    }
}
