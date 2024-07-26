import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetSchematicInformationApi {
    constructor(private client: ApiClient) {}

    async getSchematicInformation(schematicId: number): Promise<any> {
        return handleRequest(this.client, `universe/schematics/${schematicId}`);
    }
}
