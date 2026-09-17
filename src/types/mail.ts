import { z } from 'zod';
import {
  MailHeaderSchema,
  MailMessageSchema,
  MailLabelSchema,
} from '../schemas/mail';

export type MailHeader = z.infer<typeof MailHeaderSchema>;
export type MailMessage = z.infer<typeof MailMessageSchema>;
export type MailLabel = z.infer<typeof MailLabelSchema>;
