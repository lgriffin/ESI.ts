/**
 * SDE domain: market groups and accounting entry types.
 *
 * Zod schemas for the tables of this domain, next to the types in
 * ./types.ts they validate (split out of the former src/sde/schemas.ts,
 * Track S Run 12).
 */

import { z } from 'zod';

export const AccountingEntryTypeSchema = z.looseObject({
  accountingEntryTypeId: z.number().int(),
  internalName: z.string(),
  name: z.string(),
  journalMessage: z.string().nullable(),
  description: z.string().nullable(),
});

export const MarketGroupSchema = z.looseObject({
  marketGroupId: z.number().int(),
  description: z.string(),
  hasTypes: z.boolean(),
  iconId: z.number().int(),
  name: z.string(),
  parentGroupId: z.number().int().nullable(),
});
