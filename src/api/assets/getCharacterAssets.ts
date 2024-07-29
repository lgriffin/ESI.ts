import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterAssetsApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async getCharacterAssets(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/assets/`, 'GET', undefined, true);
    }
}
