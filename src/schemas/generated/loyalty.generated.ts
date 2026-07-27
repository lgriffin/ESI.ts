 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdLoyaltyPointsGetSchema = z.looseObject({
  corporation_id: z.number(),
  loyalty_points: z.number(),
});

export const LoyaltyStoresCorporationIdOffersGetSchema = z.looseObject({
  ak_cost: z.number().optional(),
  isk_cost: z.number(),
  lp_cost: z.number(),
  offer_id: z.number(),
  quantity: z.number(),
  required_items: z.array(z.looseObject({
    quantity: z.number(),
    type_id: z.number(),
  })),
  type_id: z.number(),
});
