import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseItemGroupByIdApi {
    constructor(private client: ApiClient) {}

    async getItemGroupById(groupId: number): Promise<object> {
        return handleRequest(this.client, `universe/groups/${groupId}`, 'GET', undefined, false);
    }
}
