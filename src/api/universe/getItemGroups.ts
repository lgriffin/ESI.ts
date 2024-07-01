import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseItemGroupsApi {
    constructor(private client: ApiClient) {}

    async getItemGroups(): Promise<object[]> {
        return handleRequest(this.client, 'universe/groups');
    }
}
