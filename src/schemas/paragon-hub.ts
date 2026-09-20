import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const ParagonHubCursorSchema = z.looseObject({
  after: z.string().optional(),
  before: z.string().optional(),
});

export const ParagonHubSkinrPriceSchema = z.looseObject({
  isk: z.number().optional(),
  plex: z.number().optional(),
});

export const ParagonHubSkinrListingSchema = z.looseObject({
  id: z.string(),
  state: esiEnum(['listed', 'sold_out', 'expired', 'removed']),
  last_modified: z.string(),
  seller_id: z.number(),
  skinr_id: z.string(),
  created: z.string(),
  expires: z.string(),
  quantity: z.number(),
  price: ParagonHubSkinrPriceSchema,
});

export const ParagonHubSkinrTargetSchema = z.looseObject({
  character_id: z.number().optional(),
  corporation_id: z.number().optional(),
  alliance_id: z.number().optional(),
  public: z.boolean().optional(),
});

export const ParagonHubCharacterListingSchema = z.looseObject({
  id: z.string(),
  state: esiEnum(['listed', 'sold_out', 'expired', 'removed']),
  last_modified: z.string(),
  seller_id: z.number(),
  skinr_id: z.string(),
  created: z.string(),
  expires: z.string(),
  quantity: z.number(),
  price: ParagonHubSkinrPriceSchema,
  target: ParagonHubSkinrTargetSchema,
});

export const ParagonHubSkinrResponseSchema = z.looseObject({
  cursor: ParagonHubCursorSchema.optional(),
  listings: z.array(ParagonHubSkinrListingSchema),
});

export const ParagonHubCharacterSkinrResponseSchema = z.looseObject({
  cursor: ParagonHubCursorSchema.optional(),
  listings: z.array(ParagonHubCharacterListingSchema),
});
