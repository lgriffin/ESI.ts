/* eslint-disable */
// Auto-generated client wrapper — do not edit manually
// Hand-written clients in src/clients/ take precedence

import { z } from 'zod';
import { ApiClient } from '../../core/ApiClient';
import { BaseEsiClient } from '../BaseEsiClient';
import { calendarEndpoints } from '../../core/endpoints/calendarEndpoints';
import { CalendarEventAttendeeSchema, CalendarEventDetailSchema, CalendarEventSchema } from '../../schemas/calendar';

export class GeneratedCalendarClient extends BaseEsiClient<typeof calendarEndpoints> {
  constructor(client: ApiClient) {
    super(client, calendarEndpoints);
  }

  /**
   * GET getCalendarEvents
   * @requires Authentication
   */
  getCalendarEvents(characterId: number | string): Promise<(z.infer<typeof CalendarEventSchema>)[]> {
    return this.api.getCalendarEvents(characterId) as Promise<(z.infer<typeof CalendarEventSchema>)[]>;
  }

  /**
   * GET getCalendarEventById
   * @requires Authentication
   */
  getCalendarEventById(characterId: number | string, eventId: number | string): Promise<z.infer<typeof CalendarEventDetailSchema>> {
    return this.api.getCalendarEventById(characterId, eventId) as Promise<z.infer<typeof CalendarEventDetailSchema>>;
  }

  /**
   * GET getEventAttendees
   * @requires Authentication
   */
  getEventAttendees(characterId: number | string, eventId: number | string): Promise<(z.infer<typeof CalendarEventAttendeeSchema>)[]> {
    return this.api.getEventAttendees(characterId, eventId) as Promise<(z.infer<typeof CalendarEventAttendeeSchema>)[]>;
  }

  /**
   * PUT respondToCalendarEvent
   * @requires Authentication
   */
  respondToCalendarEvent(characterId: number | string, eventId: number | string, body: unknown): Promise<unknown> {
    return (this.api.respondToCalendarEvent as any)(characterId, eventId, body) as Promise<unknown>;
  }
}
