import { GetCalendarEventsApi } from '../api/calendar/getCalendarEvents';
import { GetCalendarEventByIdApi } from '../api/calendar/getCalendarEventById';
import { RespondToCalendarEventApi } from '../api/calendar/respondToCalendarEvent';
import { GetEventAttendeesApi } from '../api/calendar/getEventAttendees';
import { ApiClient } from '../core/ApiClient';

export class CalendarClient {
    private getCalendarEventsApi: GetCalendarEventsApi;
    private getCalendarEventByIdApi: GetCalendarEventByIdApi;
    private respondToCalendarEventApi: RespondToCalendarEventApi;
    private getEventAttendeesApi: GetEventAttendeesApi;

    constructor(client: ApiClient) {
        this.getCalendarEventsApi = new GetCalendarEventsApi(client);
        this.getCalendarEventByIdApi = new GetCalendarEventByIdApi(client);
        this.respondToCalendarEventApi = new RespondToCalendarEventApi(client);
        this.getEventAttendeesApi = new GetEventAttendeesApi(client);
    }

    async getCalendarEvents(characterId: number): Promise<object[]> {
        return await this.getCalendarEventsApi.getCalendarEvents(characterId);
    }

    async getCalendarEventById(characterId: number, eventId: number): Promise<object> {
        return await this.getCalendarEventByIdApi.getCalendarEventById(characterId, eventId);
    }

    async respondToCalendarEvent(characterId: number, eventId: number, response: string): Promise<object> {
        return await this.respondToCalendarEventApi.respondToCalendarEvent(characterId, eventId, response);
    }

    async getEventAttendees(characterId: number, eventId: number): Promise<object[]> {
        return await this.getEventAttendeesApi.getEventAttendees(characterId, eventId);
    }
}
