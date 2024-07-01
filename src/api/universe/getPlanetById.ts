import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniversePlanetByIdApi {
    constructor(private client: ApiClient) {}

    async getPlanetById(planetId: number): Promise<object> {
        return handleRequest(this.client, `universe/planets/${planetId}`);
    }
}
