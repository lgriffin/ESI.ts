import { z } from 'zod';
import { KillmailSummarySchema, KillmailSchema } from '../schemas/killmails';

export type KillmailSummary = z.infer<typeof KillmailSummarySchema>;
export type Killmail = z.infer<typeof KillmailSchema>;
