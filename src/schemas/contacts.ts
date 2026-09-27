import { z } from 'zod';
import { esiEnum } from './esiEnum';

export const ContactSchema = z.looseObject({
  contact_id: z.number(),
  contact_type: esiEnum(['character', 'corporation', 'alliance', 'faction']),
  standing: z.number(),
  label_ids: z.array(z.number()).optional(),
  is_blocked: z.boolean().optional(),
  is_watched: z.boolean().optional(),
});

export const ContactLabelSchema = z.looseObject({
  label_id: z.number(),
  label_name: z.string(),
});

/** POST characters/{character_id}/contacts: the IDs of the contacts added. */
export const AddedContactIdsSchema = z.array(z.number());
