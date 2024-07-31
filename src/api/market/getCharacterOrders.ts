import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCharacterOrders {
    constructor(private client: ApiClient) {}

    async getCharacterOrders(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/orders/`, 'GET', undefined, true);
    }
}
