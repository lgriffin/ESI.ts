import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationIndustryJobsApi {
    constructor(private client: ApiClient) {}

    async getCorporationIndustryJobs(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/industry/jobs`, 'GET', undefined, true);
    }
}
