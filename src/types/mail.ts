import { z } from 'zod';
import { MailMessageSchema, MailLabelSchema } from '../schemas/mail';

export type MailMessage = z.infer<typeof MailMessageSchema>;
export type MailLabel = z.infer<typeof MailLabelSchema>;
