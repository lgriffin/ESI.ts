 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdFittingsGetSchema = z.looseObject({
  description: z.string(),
  fitting_id: z.number(),
  items: z.array(z.looseObject({
    flag: z.enum(['Cargo', 'DroneBay', 'FighterBay', 'HiSlot0', 'HiSlot1', 'HiSlot2', 'HiSlot3', 'HiSlot4', 'HiSlot5', 'HiSlot6', 'HiSlot7', 'Invalid', 'LoSlot0', 'LoSlot1', 'LoSlot2', 'LoSlot3', 'LoSlot4', 'LoSlot5', 'LoSlot6', 'LoSlot7', 'MedSlot0', 'MedSlot1', 'MedSlot2', 'MedSlot3', 'MedSlot4', 'MedSlot5', 'MedSlot6', 'MedSlot7', 'RigSlot0', 'RigSlot1', 'RigSlot2', 'ServiceSlot0', 'ServiceSlot1', 'ServiceSlot2', 'ServiceSlot3', 'ServiceSlot4', 'ServiceSlot5', 'ServiceSlot6', 'ServiceSlot7', 'SubSystemSlot0', 'SubSystemSlot1', 'SubSystemSlot2', 'SubSystemSlot3']),
    quantity: z.number(),
    type_id: z.number(),
  })),
  name: z.string(),
  ship_type_id: z.number(),
});
