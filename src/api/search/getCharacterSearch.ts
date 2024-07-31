import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class CharacterSearchApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async searchCharacter(characterId: number, searchString: string): Promise<object> {
        return handleRequest(this.client, `characters/${characterId}/search/?search=${encodeURIComponent(searchString)}`, 'GET', undefined, true);
    }
}
