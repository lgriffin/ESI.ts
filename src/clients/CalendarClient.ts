import { ApiClient } from '../core/ApiClient';
import { createClient } from '../core/endpoints/createClient';
import { calendarEndpoints } from '../core/endpoints/calendarEndpoints';
import { CalendarEvent, CalendarEventDetail, CalendarEventAttendee } from '../types/api-responses';

export class CalendarClient {
    private api: ReturnType<typeof createClient<typeof calendarEndpoints>>;

    constructor(client: ApiClient) {
        this.api = createClient(client, calendarEndpoints);
    }

    async getCalendarEvents(characterId: number): Promise<CalendarEvent[]> {
        return this.api.getCalendarEvents(characterId);
    }

    async getCalendarEventById(characterId: number, eventId: number): Promise<CalendarEventDetail> {
        return this.api.getCalendarEventById(characterId, eventId);
    }

    async respondToCalendarEvent(characterId: number, eventId: number, response: string): Promise<void> {
        return this.api.respondToCalendarEvent(characterId, eventId, response);
    }

    async getEventAttendees(characterId: number, eventId: number): Promise<CalendarEventAttendee[]> {
        return this.api.getEventAttendees(characterId, eventId);
    }
}
