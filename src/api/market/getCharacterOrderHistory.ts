import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCharacterOrderHistory {
    constructor(private client: ApiClient) {}

    async getCharacterOrderHistory(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/orders/history/`, 'GET', undefined, true);
    }
}
