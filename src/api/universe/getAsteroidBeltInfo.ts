import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseAsteroidBeltApi {
    constructor(private client: ApiClient) {}

    async getAsteroidBeltInfo(asteroidBeltId: number): Promise<object> {
        return handleRequest(this.client, `universe/asteroid_belts/${asteroidBeltId}`);
    }
}
