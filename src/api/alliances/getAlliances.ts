import { ApiClient } from '../../core/ApiClient';
import { handleRequestBody } from '../../core/ApiRequestHandler';

export class AllAlliancesApi {
    constructor(private client: ApiClient) {}

    async getAllAlliances(): Promise<object[]> {
        return handleRequestBody(this.client, 'alliances', 'GET', undefined, false);
    }
}
