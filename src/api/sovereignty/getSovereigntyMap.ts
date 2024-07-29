import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class SovereigntyMapApi {
    constructor(private client: ApiClient) {}

    async getSovereigntyMap(): Promise<any> {
        return handleRequest(this.client, 'sovereignty/map', 'GET', undefined, false);
    }
}
