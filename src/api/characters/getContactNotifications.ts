import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetContactNotificationsApi {
    constructor(private client: ApiClient) {}

    async getContactNotifications(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/notifications/contacts/`);
    }
}
