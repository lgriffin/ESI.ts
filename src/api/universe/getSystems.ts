import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseSystemsApi {
    constructor(private client: ApiClient) {}

    async getSystems(): Promise<number[]> {
        return handleRequest(this.client, `universe/systems`);
    }
}
