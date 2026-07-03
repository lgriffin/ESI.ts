import { z } from 'zod';

export const CalendarEventSchema = z.looseObject({
  event_id: z.number(),
  event_date: z.string(),
  title: z.string(),
  importance: z.number(),
  event_response: z.enum([
    'declined',
    'not_responded',
    'accepted',
    'tentative',
  ]),
});

export const CalendarEventDetailSchema = z.looseObject({
  event_id: z.number(),
  date: z.string(),
  title: z.string(),
  text: z.string(),
  owner_id: z.number(),
  owner_name: z.string(),
  owner_type: z.enum([
    'eve_server',
    'corporation',
    'faction',
    'character',
    'alliance',
  ]),
  duration: z.number(),
  importance: z.number(),
  response: z.string(),
});

export const CalendarEventAttendeeSchema = z.looseObject({
  character_id: z.number(),
  event_response: z.enum([
    'declined',
    'not_responded',
    'accepted',
    'tentative',
  ]),
});
