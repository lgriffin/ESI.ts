import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetOpportunitiesTasksApi {
    constructor(private client: ApiClient) {}

    async getOpportunitiesTasks(): Promise<any> {
        return await handleRequest(this.client, 'opportunities/tasks', 'GET', undefined, true);
    }
}
