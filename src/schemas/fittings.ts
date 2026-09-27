import { z } from 'zod';

export const FittingSchema = z.looseObject({
  fitting_id: z.number(),
  name: z.string(),
  description: z.string(),
  ship_type_id: z.number(),
  items: z.array(
    z.looseObject({
      type_id: z.number(),
      flag: z.union([z.number(), z.string()]),
      quantity: z.number(),
    }),
  ),
});

/** POST characters/{character_id}/fittings: the new fitting's ID. */
export const FittingCreatedSchema = z.looseObject({
  fitting_id: z.number(),
});
