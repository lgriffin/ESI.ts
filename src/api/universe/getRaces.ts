import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseRacesApi {
    constructor(private client: ApiClient) {}

    async getRaces(): Promise<object[]> {
        return handleRequest(this.client, 'universe/races', 'GET', undefined, false);
    }
}
