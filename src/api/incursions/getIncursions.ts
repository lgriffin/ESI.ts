import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class IncursionsApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async getIncursions(): Promise<any> {
        return handleRequest(this.client, 'incursions', 'GET', undefined, false);
    }
}
