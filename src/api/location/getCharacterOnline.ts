import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterOnlineApi {
    constructor(private client: ApiClient) {}

    async getCharacterOnline(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/online`);
    }
}
