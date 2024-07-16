import { ApiClient } from '../../core/ApiClient';
import { handleRequest } from '../../core/ApiRequestHandler';

export class GetEventAttendeesApi {
    constructor(private client: ApiClient) {}

    async getEventAttendees(characterId: number, eventId: number): Promise<object[]> {
        return await handleRequest(this.client, `characters/${characterId}/calendar/${eventId}/attendees/`, 'GET', undefined, true);
    }
}
