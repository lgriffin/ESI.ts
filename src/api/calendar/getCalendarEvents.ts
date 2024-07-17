import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCalendarEventsApi {
    constructor(private client: ApiClient) {}

    async getCalendarEvents(characterId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/calendar/`, 'GET', undefined, true);
    }
}