import { z } from 'zod';

export const LoyaltyPointsSchema = z.looseObject({
  corporation_id: z.number(),
  loyalty_points: z.number(),
});

export const LoyaltyStoreOfferSchema = z.looseObject({
  offer_id: z.number(),
  type_id: z.number(),
  quantity: z.number(),
  lp_cost: z.number(),
  isk_cost: z.number(),
  ak_cost: z.number().optional(),
  required_items: z.array(
    z.looseObject({
      type_id: z.number(),
      quantity: z.number(),
    }),
  ),
});
