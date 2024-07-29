import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetImplantsApi {
    constructor(private client: ApiClient) {}

    async getImplants(characterId: number): Promise<any> {
        const endpoint = `characters/${characterId}/implants`;
        return await handleRequest(this.client, endpoint, 'GET', undefined, true);
    }
}
