import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCorporationHistoryApi {
    constructor(private client: ApiClient) {}

    async getCorporationHistory(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/corporationhistory/`);
    }
}
