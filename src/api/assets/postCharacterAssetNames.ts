import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class PostCharacterAssetNamesApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async postCharacterAssetNames(characterId: number, itemIds: number[]): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/assets/names/`, 'POST', JSON.stringify({ item_ids: itemIds }));
    }
}
