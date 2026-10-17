import { z } from 'zod';
import {
  WalletTransactionSchema,
  CorporationWalletTransactionSchema,
  WalletJournalSchema,
} from '../schemas/wallet';

export type WalletTransaction = z.infer<typeof WalletTransactionSchema>;
export type CorporationWalletTransaction = z.infer<
  typeof CorporationWalletTransactionSchema
>;
export type WalletJournal = z.infer<typeof WalletJournalSchema>;
