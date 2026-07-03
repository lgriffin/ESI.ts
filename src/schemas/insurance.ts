import { z } from 'zod';

export const InsurancePriceSchema = z.looseObject({
  type_id: z.number(),
  levels: z.array(
    z.looseObject({
      cost: z.number(),
      payout: z.number(),
      name: z.string(),
    }),
  ),
});
