import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterRecentKillmailsApi {
    constructor(private client: ApiClient) {}

    async getCharacterRecentKillmails(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/killmails/recent`, 'GET', undefined, true);
    }
}
