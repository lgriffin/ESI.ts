import { ApiClient } from '../../core/ApiClient';
import { handleRequestBody } from '../../core/ApiRequestHandler';

export class UniverseRegionByIdApi {
    constructor(private client: ApiClient) {}

    async getRegionById(regionId: number): Promise<object> {
        return handleRequestBody(this.client, `universe/regions/${regionId}`, 'GET', undefined, false);
    }
}
