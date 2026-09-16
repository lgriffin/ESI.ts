import { z } from 'zod';
import { esiEnum } from './esiEnum';

const ContractTypeSchema = esiEnum([
  'unknown',
  'item_exchange',
  'auction',
  'courier',
  'loan',
]);

/**
 * A contract a character or corporation is party to, from
 * `GET /characters/{character_id}/contracts` and
 * `GET /corporations/{corporation_id}/contracts`.
 */
export const ContractSchema = z.looseObject({
  contract_id: z.number(),
  issuer_id: z.number(),
  issuer_corporation_id: z.number(),
  assignee_id: z.number().optional(),
  acceptor_id: z.number().optional(),
  start_location_id: z.number().optional(),
  end_location_id: z.number().optional(),
  type: ContractTypeSchema,
  status: esiEnum([
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
  ]),
  title: z.string().optional(),
  for_corporation: z.boolean().optional(),
  availability: esiEnum(['public', 'personal', 'corporation', 'alliance']),
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

/**
 * A public contract from `GET /contracts/public/{region_id}`. ESI sends no
 * status, availability, assignee or acceptor here: every listed contract is
 * public and outstanding.
 */
export const PublicContractSchema = z.looseObject({
  contract_id: z.number(),
  issuer_id: z.number(),
  issuer_corporation_id: z.number(),
  start_location_id: z.number().optional(),
  end_location_id: z.number().optional(),
  type: ContractTypeSchema,
  title: z.string().optional(),
  for_corporation: z.boolean().optional(),
  date_issued: z.string(),
  date_expired: z.string(),
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
