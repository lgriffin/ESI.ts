import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class FactionWarfareWarsApi {
    constructor(private client: ApiClient) {}

    async getWars(): Promise<object> {
        return await handleRequest(this.client, 'fw/wars');
    }
}
