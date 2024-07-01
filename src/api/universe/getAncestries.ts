import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseAncestriesApi {
    constructor(private client: ApiClient) {}

    async getAncestries(): Promise<object[]> {
        return handleRequest(this.client, 'universe/ancestries');
    }
}
