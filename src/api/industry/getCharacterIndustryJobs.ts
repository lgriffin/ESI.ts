import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterIndustryJobsApi {
    constructor(private client: ApiClient) {}

    async getCharacterIndustryJobs(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/industry/jobs`);
    }
}
