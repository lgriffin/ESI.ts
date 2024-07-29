import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseStarByIdApi {
    constructor(private client: ApiClient) {}

    async getStarById(starId: number): Promise<object> {
        return handleRequest(this.client, `universe/stars/${starId}`, 'GET', undefined, false);
    }
}
