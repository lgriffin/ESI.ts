import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class FactionWarfareSystemsApi {
    constructor(private client: ApiClient) {}

    async getSystems(): Promise<object> {
        return await handleRequest(this.client, 'fw/systems', 'GET', undefined, false);
    }
}
