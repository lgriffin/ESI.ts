import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetBlueprintsApi {
    constructor(private client: ApiClient) {}

    async getBlueprints(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/blueprints/`);
    }
}
