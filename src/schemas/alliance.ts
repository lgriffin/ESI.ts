import { z } from 'zod';

export const AllianceInfoSchema = z.looseObject({
  alliance_id: z.number().optional(),
  name: z.string(),
  ticker: z.string(),
  creator_id: z.number(),
  creator_corporation_id: z.number(),
  executor_corporation_id: z.number().optional(),
  date_founded: z.string(),
  faction_id: z.number().optional(),
});

export const AllianceContactSchema = z.looseObject({
  contact_id: z.number(),
  contact_type: z.enum(['character', 'corporation', 'alliance']),
  standing: z.number(),
  label_ids: z.array(z.number()).optional(),
});

export const AllianceContactLabelSchema = z.looseObject({
  label_id: z.number(),
  label_name: z.string(),
});

export const AllianceIconSchema = z.looseObject({
  px64x64: z.string().optional(),
  px128x128: z.string().optional(),
});
