 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: 68191d093493

import { z } from 'zod';

export const CharactersCharacterIdContractsContractIdBidsGetSchema = z.looseObject({
  amount: z.number(),
  bid_id: z.number(),
  bidder_id: z.number(),
  date_bid: z.string(),
});

export const CharactersCharacterIdContractsContractIdItemsGetSchema = z.looseObject({
  is_included: z.boolean(),
  is_singleton: z.boolean(),
  quantity: z.number(),
  raw_quantity: z.number().optional(),
  record_id: z.number(),
  type_id: z.number(),
});

export const CharactersCharacterIdContractsGetSchema = z.looseObject({
  acceptor_id: z.number(),
  assignee_id: z.number(),
  availability: z.enum(['public', 'personal', 'corporation', 'alliance']),
  buyout: z.number().optional(),
  collateral: z.number().optional(),
  contract_id: z.number(),
  date_accepted: z.string().optional(),
  date_completed: z.string().optional(),
  date_expired: z.string(),
  date_issued: z.string(),
  days_to_complete: z.number().optional(),
  end_location_id: z.number().optional(),
  for_corporation: z.boolean(),
  issuer_corporation_id: z.number(),
  issuer_id: z.number(),
  price: z.number().optional(),
  reward: z.number().optional(),
  start_location_id: z.number().optional(),
  status: z.enum(['outstanding', 'in_progress', 'finished_issuer', 'finished_contractor', 'finished', 'cancelled', 'rejected', 'failed', 'deleted', 'reversed']),
  title: z.string().optional(),
  type: z.enum(['unknown', 'item_exchange', 'auction', 'courier', 'loan']),
  volume: z.number().optional(),
});

export const ContractsPublicBidsContractIdGetSchema = z.looseObject({
  amount: z.number(),
  bid_id: z.number(),
  date_bid: z.string(),
});

export const ContractsPublicItemsContractIdGetSchema = z.looseObject({
  is_blueprint_copy: z.boolean().optional(),
  is_included: z.boolean(),
  item_id: z.number().optional(),
  material_efficiency: z.number().optional(),
  quantity: z.number(),
  record_id: z.number(),
  runs: z.number().optional(),
  time_efficiency: z.number().optional(),
  type_id: z.number(),
});

export const ContractsPublicRegionIdGetSchema = z.looseObject({
  buyout: z.number().optional(),
  collateral: z.number().optional(),
  contract_id: z.number(),
  date_expired: z.string(),
  date_issued: z.string(),
  days_to_complete: z.number().optional(),
  end_location_id: z.number().optional(),
  for_corporation: z.boolean().optional(),
  issuer_corporation_id: z.number(),
  issuer_id: z.number(),
  price: z.number().optional(),
  reward: z.number().optional(),
  start_location_id: z.number().optional(),
  title: z.string().optional(),
  type: z.enum(['unknown', 'item_exchange', 'auction', 'courier', 'loan']),
  volume: z.number().optional(),
});

export const CorporationsCorporationIdContractsContractIdBidsGetSchema = z.looseObject({
  amount: z.number(),
  bid_id: z.number(),
  bidder_id: z.number(),
  date_bid: z.string(),
});

export const CorporationsCorporationIdContractsContractIdItemsGetSchema = z.looseObject({
  is_included: z.boolean(),
  is_singleton: z.boolean(),
  quantity: z.number(),
  raw_quantity: z.number().optional(),
  record_id: z.number(),
  type_id: z.number(),
});

export const CorporationsCorporationIdContractsGetSchema = z.looseObject({
  acceptor_id: z.number(),
  assignee_id: z.number(),
  availability: z.enum(['public', 'personal', 'corporation', 'alliance']),
  buyout: z.number().optional(),
  collateral: z.number().optional(),
  contract_id: z.number(),
  date_accepted: z.string().optional(),
  date_completed: z.string().optional(),
  date_expired: z.string(),
  date_issued: z.string(),
  days_to_complete: z.number().optional(),
  end_location_id: z.number().optional(),
  for_corporation: z.boolean(),
  issuer_corporation_id: z.number(),
  issuer_id: z.number(),
  price: z.number().optional(),
  reward: z.number().optional(),
  start_location_id: z.number().optional(),
  status: z.enum(['outstanding', 'in_progress', 'finished_issuer', 'finished_contractor', 'finished', 'cancelled', 'rejected', 'failed', 'deleted', 'reversed']),
  title: z.string().optional(),
  type: z.enum(['unknown', 'item_exchange', 'auction', 'courier', 'loan']),
  volume: z.number().optional(),
});
