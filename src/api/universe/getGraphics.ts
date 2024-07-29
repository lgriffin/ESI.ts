import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseGraphicsApi {
    constructor(private client: ApiClient) {}

    async getGraphics(): Promise<object[]> {
        return handleRequest(this.client, 'universe/graphics', 'GET', undefined, false);
    }
}
