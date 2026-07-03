import { z } from 'zod';

export const ContractSchema = z.looseObject({
  contract_id: z.number(),
  issuer_id: z.number(),
  issuer_corporation_id: z.number(),
  assignee_id: z.number().optional(),
  acceptor_id: z.number().optional(),
  start_location_id: z.number().optional(),
  end_location_id: z.number().optional(),
  type: z.enum(['unknown', 'item_exchange', 'auction', 'courier', 'loan']),
  status: z
    .enum([
      'outstanding',
      'in_progress',
      'finished_issuer',
      'finished_contractor',
      'finished',
      'cancelled',
      'rejected',
      'failed',
      'deleted',
      'reversed',
    ])
    .optional(),
  title: z.string().optional(),
  for_corporation: z.boolean().optional(),
  availability: z
    .enum(['public', 'personal', 'corporation', 'alliance'])
    .optional(),
  date_issued: z.string(),
  date_expired: z.string(),
  date_accepted: z.string().optional(),
  date_completed: z.string().optional(),
  days_to_complete: z.number().optional(),
  price: z.number().optional(),
  reward: z.number().optional(),
  collateral: z.number().optional(),
  buyout: z.number().optional(),
  volume: z.number().optional(),
});

export const ContractItemSchema = z.looseObject({
  record_id: z.number(),
  type_id: z.number(),
  quantity: z.number(),
  raw_quantity: z.number().optional(),
  is_singleton: z.boolean(),
  is_blueprint_copy: z.boolean().optional(),
  is_included: z.boolean(),
});

export const ContractBidSchema = z.looseObject({
  bid_id: z.number(),
  bidder_id: z.number(),
  date_bid: z.string(),
  amount: z.number(),
});
