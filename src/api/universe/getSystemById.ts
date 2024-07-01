import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseSystemByIdApi {
    constructor(private client: ApiClient) {}

    async getSystemById(systemId: number): Promise<object> {
        return handleRequest(this.client, `universe/systems/${systemId}`);
    }
}
