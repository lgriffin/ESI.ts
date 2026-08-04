 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdCalendarEventIdAttendeesGetSchema = z.looseObject({
  character_id: z.number().optional(),
  event_response: z.enum(['declined', 'not_responded', 'accepted', 'tentative']).optional(),
});

export const CharactersCharacterIdCalendarEventIdGetSchema = z.looseObject({
  date: z.string(),
  duration: z.number(),
  event_id: z.number(),
  importance: z.number(),
  owner_id: z.number(),
  owner_name: z.string(),
  owner_type: z.enum(['eve_server', 'corporation', 'faction', 'character', 'alliance']),
  response: z.string(),
  text: z.string(),
  title: z.string(),
});

export const CharactersCharacterIdCalendarGetSchema = z.looseObject({
  event_date: z.string().optional(),
  event_id: z.number().optional(),
  event_response: z.enum(['declined', 'not_responded', 'accepted', 'tentative']).optional(),
  importance: z.number().optional(),
  title: z.string().optional(),
});
