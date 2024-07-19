import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationBlueprintsApi {
    constructor(private client: ApiClient) {}

    async getCorporationBlueprints(corporationId: number): Promise<any> {
        return handleRequest(this.client, `corporations/${corporationId}/blueprints`);
    }
}
