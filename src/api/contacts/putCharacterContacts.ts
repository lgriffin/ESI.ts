import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class putCharacterContacts {
    constructor(private client: ApiClient) {}

    async editContacts(characterId: number, contacts: any): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contacts`, 'PUT', JSON.stringify(contacts), true);
    }
}
