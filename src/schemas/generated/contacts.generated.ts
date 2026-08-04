 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const AlliancesAllianceIdContactsGetSchema = z.looseObject({
  contact_id: z.number(),
  contact_type: z.enum(['character', 'corporation', 'alliance', 'faction']),
  label_ids: z.array(z.number()).optional(),
  standing: z.number(),
});

export const AlliancesAllianceIdContactsLabelsGetSchema = z.looseObject({
  label_id: z.number(),
  label_name: z.string(),
});

export const CharactersCharacterIdContactsGetSchema = z.looseObject({
  contact_id: z.number(),
  contact_type: z.enum(['character', 'corporation', 'alliance', 'faction']),
  is_blocked: z.boolean().optional(),
  is_watched: z.boolean().optional(),
  label_ids: z.array(z.number()).optional(),
  standing: z.number(),
});

export const CharactersCharacterIdContactsLabelsGetSchema = z.looseObject({
  label_id: z.number(),
  label_name: z.string(),
});

export const CorporationsCorporationIdContactsGetSchema = z.looseObject({
  contact_id: z.number(),
  contact_type: z.enum(['character', 'corporation', 'alliance', 'faction']),
  is_watched: z.boolean().optional(),
  label_ids: z.array(z.number()).optional(),
  standing: z.number(),
});

export const CorporationsCorporationIdContactsLabelsGetSchema = z.looseObject({
  label_id: z.number(),
  label_name: z.string(),
});
