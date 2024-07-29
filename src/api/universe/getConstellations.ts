import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseConstellationsApi {
    constructor(private client: ApiClient) {}

    async getConstellations(): Promise<object[]> {
        return handleRequest(this.client, 'universe/constellations', 'GET', undefined, false);
    }
}
