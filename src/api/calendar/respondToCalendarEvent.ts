import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class RespondToCalendarEventApi {
    constructor(private client: ApiClient) {}

    async respondToCalendarEvent(characterId: number, eventId: number, response: string): Promise<object> {
        const body = JSON.stringify({ response });
        return await handleRequest(this.client, `characters/${characterId}/calendar/${eventId}/`, 'PUT', body, true);
    }
}
