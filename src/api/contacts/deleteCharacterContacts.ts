import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class deleteCharacterContacts {
    constructor(private client: ApiClient) {}

    async deleteCharacterContacts(characterId: number, contactIds: number[]): Promise<any> {
        return handleRequest(this.client, `characters/${characterId}/contacts`, 'DELETE', JSON.stringify({ contact_ids: contactIds }), true);
    }
}
