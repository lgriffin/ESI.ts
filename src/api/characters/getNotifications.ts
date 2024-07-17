import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetNotificationsApi {
    constructor(private client: ApiClient) {}

    async getNotifications(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/notifications/`);
    }
}
