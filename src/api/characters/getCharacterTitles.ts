import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterTitlesApi {
    constructor(private client: ApiClient) {}

    async getCharacterTitles(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/titles`, 'GET', undefined, true);
    }
}
