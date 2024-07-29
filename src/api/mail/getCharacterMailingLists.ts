import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCharacterMailingListsApi {
    constructor(private client: ApiClient) {}

    async getMailingLists(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/mail/lists/`, 'GET', undefined, true);
    }
}
