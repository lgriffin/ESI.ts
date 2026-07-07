import { z } from 'zod';

export const MailMessageSchema = z.looseObject({
  mail_id: z.number().optional(),
  subject: z.string().optional(),
  from: z.number().optional(),
  timestamp: z.string().optional(),
  labels: z.array(z.number()).optional(),
  is_read: z.boolean().optional(),
  body: z.string().optional(),
  recipients: z
    .array(
      z.looseObject({
        recipient_id: z.number(),
        recipient_type: z.enum([
          'alliance',
          'character',
          'corporation',
          'mailing_list',
        ]),
      }),
    )
    .optional(),
});

export const MailLabelSchema = z.looseObject({
  label_id: z.number(),
  name: z.string(),
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
