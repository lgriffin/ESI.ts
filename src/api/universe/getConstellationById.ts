import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseConstellationByIdApi {
    constructor(private client: ApiClient) {}

    async getConstellationById(constellationId: number): Promise<object> {
        return handleRequest(this.client, `universe/constellations/${constellationId}`);
    }
}
