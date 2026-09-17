import { z } from 'zod';
import { esiEnum } from './esiEnum';

const MailRecipientSchema = z.looseObject({
  recipient_id: z.number(),
  recipient_type: esiEnum([
    'alliance',
    'character',
    'corporation',
    'mailing_list',
  ]),
});

/**
 * One inbox summary, from `GET /characters/{character_id}/mail`. Carries the
 * mail_id and the `is_read` flag; the body is only on the single message.
 */
export const MailHeaderSchema = z.looseObject({
  mail_id: z.number().optional(),
  subject: z.string().optional(),
  from: z.number().optional(),
  timestamp: z.string().optional(),
  labels: z.array(z.number()).optional(),
  is_read: z.boolean().optional(),
  recipients: z.array(MailRecipientSchema).optional(),
});

/**
 * A full message, from `GET /characters/{character_id}/mail/{mail_id}`. ESI
 * names the read flag `read` here and does not echo the mail_id.
 */
export const MailMessageSchema = z.looseObject({
  subject: z.string().optional(),
  from: z.number().optional(),
  timestamp: z.string().optional(),
  labels: z.array(z.number()).optional(),
  read: z.boolean().optional(),
  body: z.string().optional(),
  recipients: z.array(MailRecipientSchema).optional(),
});

export const MailLabelSchema = z.looseObject({
  label_id: z.number().optional(),
  name: z.string().optional(),
  color: z.string().optional(),
  unread_count: z.number().optional(),
});

export const MailLabelsResponseSchema = z.looseObject({
  labels: z.array(MailLabelSchema).optional(),
  total_unread_count: z.number().optional(),
});

export const MailingListSchema = z.looseObject({
  mailing_list_id: z.number(),
  name: z.string(),
});
