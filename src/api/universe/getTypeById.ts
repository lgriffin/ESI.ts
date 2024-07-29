import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseTypeByIdApi {
    constructor(private client: ApiClient) {}

    async getTypeById(typeId: number): Promise<object> {
        return handleRequest(this.client, `universe/types/${typeId}`, 'GET', undefined, false);
    }
}
