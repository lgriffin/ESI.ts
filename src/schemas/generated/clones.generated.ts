 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdClonesGetSchema = z.looseObject({
  home_location: z.looseObject({
    location_id: z.number().optional(),
    location_type: z.enum(['station', 'structure']).optional(),
  }).optional(),
  jump_clones: z.array(z.looseObject({
    implants: z.array(z.number()),
    jump_clone_id: z.number(),
    location_id: z.number(),
    location_type: z.enum(['station', 'structure']),
    name: z.string().optional(),
  })),
  last_clone_jump_date: z.string().optional(),
  last_station_change_date: z.string().optional(),
});
