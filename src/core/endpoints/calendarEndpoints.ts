import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  CalendarEventSchema,
  CalendarEventDetailSchema,
  CalendarEventAttendeeSchema,
} from '../../schemas/calendar';

export const calendarEndpoints = {
  getCalendarEvents: {
    path: 'characters/{characterId}/calendar/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(CalendarEventSchema),
  },
  getCalendarEventById: {
    path: 'characters/{characterId}/calendar/{eventId}/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    responseSchema: CalendarEventDetailSchema,
  },
  getEventAttendees: {
    path: 'characters/{characterId}/calendar/{eventId}/attendees/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    responseSchema: z.array(CalendarEventAttendeeSchema),
  },
  respondToCalendarEvent: {
    path: 'characters/{characterId}/calendar/{eventId}/',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    bodyBuilder: (response: string) => ({ response }),
  },
} as const satisfies EndpointMap;
