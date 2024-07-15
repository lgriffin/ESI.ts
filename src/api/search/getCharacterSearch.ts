import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class CharacterSearchApi {
    private client: ApiClient;

    constructor(client: ApiClient) {
        this.client = client;
    }

    async searchCharacter(characterId: number, searchString: string): Promise<object> {
        const endpoint = `characters/${characterId}/search/?search=${encodeURIComponent(searchString)}`;
        return handleRequest(this.client, endpoint);
    }
}
