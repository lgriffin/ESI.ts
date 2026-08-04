 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const InsurancePricesGetSchema = z.looseObject({
  levels: z.array(z.looseObject({
    cost: z.number(),
    name: z.string(),
    payout: z.number(),
  })),
  type_id: z.number(),
});
