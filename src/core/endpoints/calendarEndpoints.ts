import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const calendarEndpoints = {
  getCalendarEvents: {
    path: 'characters/{characterId}/calendar/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCalendarEventById: {
    path: 'characters/{characterId}/calendar/{eventId}/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
  },
  getEventAttendees: {
    path: 'characters/{characterId}/calendar/{eventId}/attendees/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
  },
  respondToCalendarEvent: {
    path: 'characters/{characterId}/calendar/{eventId}/',
    method: 'PUT',
    requiresAuth: true,
    pathParams: ['characterId', 'eventId'],
    bodyBuilder: (response: string) => ({ response }),
  },
} as const satisfies EndpointMap;
