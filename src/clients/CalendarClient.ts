import { ApiClient } from '../core/ApiClient';
import { BaseEsiClient } from './BaseEsiClient';
import { calendarEndpoints } from '../core/endpoints/calendarEndpoints';
import {
  CalendarEvent,
  CalendarEventDetail,
  CalendarEventAttendee,
} from '../types/api-responses';
import { PageResult } from '../core/pagination/AsyncPaginationIterator';

export class CalendarClient extends BaseEsiClient<typeof calendarEndpoints> {
  constructor(client: ApiClient) {
    super(client, calendarEndpoints);
  }

  /**
   * Retrieve a character's upcoming calendar events.
   *
   * @param characterId - The ID of the character whose calendar events to retrieve
   * @returns A list of upcoming calendar events
   * @requires Authentication
   */
  getCalendarEvents(characterId: number): Promise<CalendarEvent[]> {
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
  getCalendarEventById(
    characterId: number,
    eventId: number,
  ): Promise<CalendarEventDetail> {
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
  respondToCalendarEvent(
    characterId: number,
    eventId: number,
    response: string,
  ): Promise<void> {
    return this.api.respondToCalendarEvent(
      characterId,
      eventId,
      response,
    ) as Promise<void>;
  }

  /**
   * Retrieve the list of attendees and their response statuses for a calendar event.
   *
   * @param characterId - The ID of the character who owns the event
   * @param eventId - The ID of the calendar event whose attendees to retrieve
   * @returns A list of attendees with their response statuses
   * @requires Authentication
   */
  getEventAttendees(
    characterId: number,
    eventId: number,
  ): Promise<CalendarEventAttendee[]> {
    return this.api.getEventAttendees(characterId, eventId);
  }

  fetchAllCalendarEvents(
    characterId: number,
    concurrency?: number,
  ): Promise<CalendarEvent[]> {
    return this.fetchAllEndpoint<CalendarEvent>(
      'getCalendarEvents',
      [characterId],
      concurrency,
    );
  }

  fetchAllEventAttendees(
    characterId: number,
    eventId: number,
    concurrency?: number,
  ): Promise<CalendarEventAttendee[]> {
    return this.fetchAllEndpoint<CalendarEventAttendee>(
      'getEventAttendees',
      [characterId, eventId],
      concurrency,
    );
  }

  streamCalendarEvents(
    characterId: number,
  ): AsyncGenerator<PageResult<CalendarEvent>, void, undefined> {
    return this.streamEndpoint<CalendarEvent>('getCalendarEvents', characterId);
  }

  streamEventAttendees(
    characterId: number,
    eventId: number,
  ): AsyncGenerator<PageResult<CalendarEventAttendee>, void, undefined> {
    return this.streamEndpoint<CalendarEventAttendee>(
      'getEventAttendees',
      characterId,
      eventId,
    );
  }
}
