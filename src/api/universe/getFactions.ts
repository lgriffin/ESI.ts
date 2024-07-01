import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseFactionsApi {
    constructor(private client: ApiClient) {}

    async getFactions(): Promise<object[]> {
        return handleRequest(this.client, 'universe/factions');
    }
}
