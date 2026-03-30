import { ApiClient } from '../core/ApiClient';
import { createClient, WithMetadata } from '../core/endpoints/createClient';
import { calendarEndpoints } from '../core/endpoints/calendarEndpoints';
import { CalendarEvent, CalendarEventDetail, CalendarEventAttendee } from '../types/api-responses';

export class CalendarClient {
    private api: ReturnType<typeof createClient<typeof calendarEndpoints>>;
    private _client: ApiClient;
    private _metaApi?: ReturnType<typeof createClient<typeof calendarEndpoints>>;

    constructor(client: ApiClient) {
        this._client = client;
        this.api = createClient(client, calendarEndpoints);
    }

    /**
     * Retrieve a character's upcoming calendar events.
     *
     * @param characterId - The ID of the character whose calendar events to retrieve
     * @returns A list of upcoming calendar events
     * @requires Authentication
     */
    async getCalendarEvents(characterId: number): Promise<CalendarEvent[]> {
        return this.api.getCalendarEvents(characterId);
    }

    /**
     * Retrieve detailed information about a specific calendar event for a character.
     *
     * @param characterId - The ID of the character who owns the event
     * @param eventId - The ID of the calendar event to retrieve
     * @returns Detailed event information including title, description, and timing
     * @requires Authentication
     */
    async getCalendarEventById(characterId: number, eventId: number): Promise<CalendarEventDetail> {
        return this.api.getCalendarEventById(characterId, eventId);
    }

    /**
     * Set a character's response to a calendar event (accepted, declined, or tentative).
     *
     * @param characterId - The ID of the character responding to the event
     * @param eventId - The ID of the calendar event to respond to
     * @param response - The response status to set for this event
     * @requires Authentication
     */
    async respondToCalendarEvent(characterId: number, eventId: number, response: string): Promise<void> {
        return this.api.respondToCalendarEvent(characterId, eventId, response);
    }

    /**
     * Retrieve the list of attendees and their response statuses for a calendar event.
     *
     * @param characterId - The ID of the character who owns the event
     * @param eventId - The ID of the calendar event whose attendees to retrieve
     * @returns A list of attendees with their response statuses
     * @requires Authentication
     */
    async getEventAttendees(characterId: number, eventId: number): Promise<CalendarEventAttendee[]> {
        return this.api.getEventAttendees(characterId, eventId);
    }

    withMetadata(): WithMetadata<Omit<CalendarClient, 'withMetadata'>> {
        if (!this._metaApi) {
            this._metaApi = createClient(this._client, calendarEndpoints, { returnMetadata: true });
        }
        return this._metaApi as unknown as WithMetadata<Omit<CalendarClient, 'withMetadata'>>;
    }
}
