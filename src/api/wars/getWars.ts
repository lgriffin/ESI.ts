import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class WarsApi {
    constructor(private client: ApiClient) {}

    async getWars(): Promise<object[]> {
        return handleRequest(this.client, 'wars', 'GET', undefined, false);
    }
}
