import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class RouteApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async getRoute(origin: number, destination: number): Promise<object> {
        return handleRequest(this.client, `route/${origin}/${destination}`, 'GET', undefined, false);
    }
}
