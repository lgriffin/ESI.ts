import { z } from 'zod';
import {
  WalletTransactionSchema,
  WalletJournalSchema,
} from '../schemas/wallet';

export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
export type WalletJournal = z.infer<typeof WalletJournalSchema>;
