import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CalendarEventSchema,
  CalendarEventDetailSchema,
  CalendarEventAttendeeSchema,
} from '../../schemas/calendar';

export const calendarEndpoints = {
  getCalendarEvents: fromOperation('GetCharactersCharacterIdCalendar', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(CalendarEventSchema),
  }),
  getCalendarEventById: fromOperation(
    'GetCharactersCharacterIdCalendarEventId',
    {
      trailingSlash: true,
      pathParams: ['characterId', 'eventId'],
      responseSchema: CalendarEventDetailSchema,
    },
  ),
  getEventAttendees: fromOperation(
    'GetCharactersCharacterIdCalendarEventIdAttendees',
    {
      trailingSlash: true,
      pathParams: ['characterId', 'eventId'],
      responseSchema: z.array(CalendarEventAttendeeSchema),
    },
  ),
  respondToCalendarEvent: fromOperation(
    'PutCharactersCharacterIdCalendarEventId',
    {
      trailingSlash: true,
      pathParams: ['characterId', 'eventId'],
      bodyBuilder: (response: string) => ({ response }),
    },
  ),
} as const satisfies EndpointMap;
