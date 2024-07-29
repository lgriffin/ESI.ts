import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetIndustrySystemsApi {
    constructor(private client: ApiClient) {}

    async getIndustrySystems(): Promise<any> {
        return handleRequest(this.client, `industry/systems`, 'GET', undefined, false);
    }
}
