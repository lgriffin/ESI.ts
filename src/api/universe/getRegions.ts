import { ApiClient } from '../../core/ApiClient';
import { handleRequestBody } from '../../core/ApiRequestHandler';

export class UniverseRegionsApi {
    constructor(private client: ApiClient) {}

    async getRegions(): Promise<number[]> {
        return handleRequestBody(this.client, 'universe/regions', 'GET', undefined, false);
    }
}
