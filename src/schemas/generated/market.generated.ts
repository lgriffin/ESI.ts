 
// Auto-generated Zod schemas from ESI OpenAPI spec — do not edit manually
// Spec hash: a0ec73787c55

import { z } from 'zod';

export const CharactersCharacterIdOrdersGetSchema = z.looseObject({
  duration: z.number(),
  escrow: z.number().optional(),
  is_buy_order: z.boolean().optional(),
  is_corporation: z.boolean(),
  issued: z.string(),
  location_id: z.number(),
  min_volume: z.number().optional(),
  order_id: z.number(),
  price: z.number(),
  range: z.enum(['1', '10', '2', '20', '3', '30', '4', '40', '5', 'region', 'solarsystem', 'station']),
  region_id: z.number(),
  type_id: z.number(),
  volume_remain: z.number(),
  volume_total: z.number(),
});

export const CharactersCharacterIdOrdersHistoryGetSchema = z.looseObject({
  duration: z.number(),
  escrow: z.number().optional(),
  is_buy_order: z.boolean().optional(),
  is_corporation: z.boolean(),
  issued: z.string(),
  location_id: z.number(),
  min_volume: z.number().optional(),
  order_id: z.number(),
  price: z.number(),
  range: z.enum(['1', '10', '2', '20', '3', '30', '4', '40', '5', 'region', 'solarsystem', 'station']),
  region_id: z.number(),
  state: z.enum(['cancelled', 'expired']),
  type_id: z.number(),
  volume_remain: z.number(),
  volume_total: z.number(),
});

export const CorporationsCorporationIdOrdersGetSchema = z.looseObject({
  duration: z.number(),
  escrow: z.number().optional(),
  is_buy_order: z.boolean().optional(),
  issued: z.string(),
  issued_by: z.number(),
  location_id: z.number(),
  min_volume: z.number().optional(),
  order_id: z.number(),
  price: z.number(),
  range: z.enum(['1', '10', '2', '20', '3', '30', '4', '40', '5', 'region', 'solarsystem', 'station']),
  region_id: z.number(),
  type_id: z.number(),
  volume_remain: z.number(),
  volume_total: z.number(),
  wallet_division: z.number(),
});

export const CorporationsCorporationIdOrdersHistoryGetSchema = z.looseObject({
  duration: z.number(),
  escrow: z.number().optional(),
  is_buy_order: z.boolean().optional(),
  issued: z.string(),
  issued_by: z.number().optional(),
  location_id: z.number(),
  min_volume: z.number().optional(),
  order_id: z.number(),
  price: z.number(),
  range: z.enum(['1', '10', '2', '20', '3', '30', '4', '40', '5', 'region', 'solarsystem', 'station']),
  region_id: z.number(),
  state: z.enum(['cancelled', 'expired']),
  type_id: z.number(),
  volume_remain: z.number(),
  volume_total: z.number(),
  wallet_division: z.number(),
});

export const MarketsGroupsMarketGroupIdGetSchema = z.looseObject({
  description: z.string(),
  market_group_id: z.number(),
  name: z.string(),
  parent_group_id: z.number().optional(),
  types: z.array(z.number()),
});

export const MarketsPricesGetSchema = z.looseObject({
  adjusted_price: z.number().optional(),
  average_price: z.number().optional(),
  type_id: z.number(),
});

export const MarketsRegionIdHistoryGetSchema = z.looseObject({
  average: z.number(),
  date: z.string(),
  highest: z.number(),
  lowest: z.number(),
  order_count: z.number(),
  volume: z.number(),
});

export const MarketsRegionIdOrdersGetSchema = z.looseObject({
  duration: z.number(),
  is_buy_order: z.boolean(),
  issued: z.string(),
  location_id: z.number(),
  min_volume: z.number(),
  order_id: z.number(),
  price: z.number(),
  range: z.enum(['station', 'region', 'solarsystem', '1', '2', '3', '4', '5', '10', '20', '30', '40']),
  system_id: z.number(),
  type_id: z.number(),
  volume_remain: z.number(),
  volume_total: z.number(),
});

export const MarketsStructuresStructureIdGetSchema = z.looseObject({
  duration: z.number(),
  is_buy_order: z.boolean(),
  issued: z.string(),
  location_id: z.number(),
  min_volume: z.number(),
  order_id: z.number(),
  price: z.number(),
  range: z.enum(['station', 'region', 'solarsystem', '1', '2', '3', '4', '5', '10', '20', '30', '40']),
  type_id: z.number(),
  volume_remain: z.number(),
  volume_total: z.number(),
});
