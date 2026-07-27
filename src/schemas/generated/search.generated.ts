 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdSearchGetSchema = z.looseObject({
  agent: z.array(z.number()).optional(),
  alliance: z.array(z.number()).optional(),
  character: z.array(z.number()).optional(),
  constellation: z.array(z.number()).optional(),
  corporation: z.array(z.number()).optional(),
  faction: z.array(z.number()).optional(),
  inventory_type: z.array(z.number()).optional(),
  region: z.array(z.number()).optional(),
  solar_system: z.array(z.number()).optional(),
  station: z.array(z.number()).optional(),
  structure: z.array(z.number()).optional(),
});
