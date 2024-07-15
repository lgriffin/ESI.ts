import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetOpportunitiesGroupsApi {
    constructor(private client: ApiClient) {}

    async getOpportunitiesGroups(): Promise<any> {
        return await handleRequest(this.client, 'opportunities/groups');
    }
}
