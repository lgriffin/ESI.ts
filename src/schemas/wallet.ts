import { z } from 'zod';

export const WalletTransactionSchema = z.looseObject({
  transaction_id: z.number(),
  date: z.string(),
  type_id: z.number(),
  location_id: z.number(),
  unit_price: z.number(),
  quantity: z.number(),
  client_id: z.number(),
  is_buy: z.boolean(),
  is_personal: z.boolean(),
  journal_ref_id: z.number(),
});

export const WalletJournalSchema = z.looseObject({
  id: z.number(),
  date: z.string(),
  ref_type: z.string(),
  first_party_id: z.number().optional(),
  second_party_id: z.number().optional(),
  amount: z.number().optional(),
  balance: z.number().optional(),
  reason: z.string().optional(),
  description: z.string(),
  context_id: z.number().optional(),
  context_id_type: z.string().optional(),
});
