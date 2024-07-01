import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseRegionByIdApi {
    constructor(private client: ApiClient) {}

    async getRegionById(regionId: number): Promise<object> {
        return handleRequest(this.client, `universe/regions/${regionId}`);
    }
}
