import { ApiClient } from '../../core/ApiClient';
import { handleRequestBody } from '../../core/ApiRequestHandler';

export class UniverseSchematicByIdApi {
    constructor(private client: ApiClient) {}

    async getSchematicById(schematicId: number): Promise<object> {
        return handleRequestBody(this.client, `universe/schematics/${schematicId}`, 'GET', undefined, false);
    }
}
