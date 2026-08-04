 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdMailGetSchema = z.looseObject({
  from: z.number().optional(),
  is_read: z.boolean().optional(),
  labels: z.array(z.number()).optional(),
  mail_id: z.number().optional(),
  recipients: z.array(z.looseObject({
    recipient_id: z.number(),
    recipient_type: z.enum(['alliance', 'character', 'corporation', 'mailing_list']),
  })).optional(),
  subject: z.string().optional(),
  timestamp: z.string().optional(),
});

export const CharactersCharacterIdMailLabelsGetSchema = z.looseObject({
  labels: z.array(z.looseObject({
    color: z.enum(['#0000fe', '#006634', '#0099ff', '#00ff33', '#01ffff', '#349800', '#660066', '#666666', '#999999', '#99ffff', '#9a0000', '#ccff9a', '#e6e6e6', '#fe0000', '#ff6600', '#ffff01', '#ffffcd', '#ffffff']).optional(),
    label_id: z.number().optional(),
    name: z.string().optional(),
    unread_count: z.number().optional(),
  })).optional(),
  total_unread_count: z.number().optional(),
});

export const CharactersCharacterIdMailListsGetSchema = z.looseObject({
  mailing_list_id: z.number(),
  name: z.string(),
});

export const CharactersCharacterIdMailMailIdGetSchema = z.looseObject({
  body: z.string().optional(),
  from: z.number().optional(),
  labels: z.array(z.number()).optional(),
  read: z.boolean().optional(),
  recipients: z.array(z.looseObject({
    recipient_id: z.number(),
    recipient_type: z.enum(['alliance', 'character', 'corporation', 'mailing_list']),
  })).optional(),
  subject: z.string().optional(),
  timestamp: z.string().optional(),
});
