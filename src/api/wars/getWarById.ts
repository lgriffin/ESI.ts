import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class WarByIdApi {
    constructor(private client: ApiClient) {}

    async getWarById(warId: number): Promise<object> {
        return handleRequest(this.client, `wars/${warId}`, 'GET', undefined, false);
    }
}
