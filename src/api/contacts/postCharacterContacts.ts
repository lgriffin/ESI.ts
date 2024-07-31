import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class postCharacterContacts {
    constructor(private client: ApiClient) {}

    async addContacts(characterId: number, contacts: any): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contacts`, 'POST', JSON.stringify(contacts), true);
    }
}
