import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetOpportunitiesGroupByIdApi {
    constructor(private client: ApiClient) {}

    async getOpportunitiesGroupById(groupId: number): Promise<any> {
        return await handleRequest(this.client, `opportunities/groups/${groupId}`, 'GET', undefined, false);
    }
}
