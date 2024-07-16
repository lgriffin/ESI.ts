import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetCalendarEventByIdApi {
    constructor(private client: ApiClient) {}

    async getCalendarEventById(characterId: number, eventId: number): Promise<object> {
        return await handleRequest(this.client, `characters/${characterId}/calendar/${eventId}/`, 'GET', undefined, true);
    }
}
