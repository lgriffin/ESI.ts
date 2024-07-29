import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class UniverseStructureByIdApi {
    constructor(private client: ApiClient) {}

    async getStructureById(structureId: number): Promise<object> {
        return handleRequest(this.client, `universe/structures/${structureId}`, 'GET', undefined, true);
    }
}
