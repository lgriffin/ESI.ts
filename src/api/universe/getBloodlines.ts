import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseBloodlinesApi {
    constructor(private client: ApiClient) {}

    async getBloodlines(): Promise<object[]> {
        return handleRequest(this.client, 'universe/bloodlines');
    }
}
