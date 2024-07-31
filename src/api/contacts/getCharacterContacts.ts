import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class getCharacterContacts {
    constructor(private client: ApiClient) {}

    async getContacts(characterId: number): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contacts`, 'GET', undefined, true);
    }
}
