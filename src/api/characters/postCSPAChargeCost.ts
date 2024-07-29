import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCspaChargeCostApi {
    constructor(private client: ApiClient) {}

    async calculateCspaChargeCost(characterId: number, body: object): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/cspa/`, 'POST', JSON.stringify(body), true);
    }
}
