import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetSwaggerJsonApi {
    constructor(private client: ApiClient) {}

    async getSwaggerJson(): Promise<any> {
        return handleRequest(this.client, 'meta/swagger.json', 'GET', undefined, false);
    }
}
