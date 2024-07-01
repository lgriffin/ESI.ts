import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseStargateByIdApi {
    constructor(private client: ApiClient) {}

    async getStargateById(stargateId: number): Promise<object> {
        return handleRequest(this.client, `universe/stargates/${stargateId}`);
    }
}
