import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/requestHandler';

export class AlliancesApi {
    constructor(private client: ApiClient) {}

    async getAllAlliances(): Promise<object[]> {
        return handleRequest(this.client, 'alliances');
    }
}
