import { z } from 'zod';
import { esiEnum } from './esiEnum';

/** Region market order (`GET /markets/{region_id}/orders/`). */
export const MarketOrderSchema = z.looseObject({
  order_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  volume_total: z.number(),
  volume_remain: z.number(),
  min_volume: z.number(),
  price: z.number(),
  is_buy_order: z.boolean(),
  system_id: z.number(),
  duration: z.number(),
  issued: z.string(),
  range: z.string(),
});

/** Character open order (`GET /characters/{character_id}/orders/`). */
export const CharacterMarketOrderSchema = z.looseObject({
  order_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  volume_total: z.number(),
  volume_remain: z.number(),
  min_volume: z.number().optional(),
  price: z.number(),
  is_buy_order: z.boolean().optional(),
  is_corporation: z.boolean(),
  region_id: z.number(),
  duration: z.number(),
  issued: z.string(),
  range: z.string(),
  escrow: z.number().optional(),
});

/** Character order history (`GET /characters/{character_id}/orders/history/`). */
export const CharacterMarketOrderHistorySchema = z.looseObject({
  order_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  volume_total: z.number(),
  volume_remain: z.number(),
  min_volume: z.number().optional(),
  price: z.number(),
  is_buy_order: z.boolean().optional(),
  is_corporation: z.boolean(),
  region_id: z.number(),
  duration: z.number(),
  issued: z.string(),
  range: z.string(),
  state: esiEnum(['cancelled', 'expired']),
  escrow: z.number().optional(),
});

/** Corporation open order (`GET /corporations/{corporation_id}/orders/`). */
export const CorporationMarketOrderSchema = z.looseObject({
  order_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  volume_total: z.number(),
  volume_remain: z.number(),
  min_volume: z.number().optional(),
  price: z.number(),
  is_buy_order: z.boolean().optional(),
  issued_by: z.number(),
  region_id: z.number(),
  wallet_division: z.number(),
  duration: z.number(),
  issued: z.string(),
  range: z.string(),
  escrow: z.number().optional(),
});

/** Corporation order history (`GET /corporations/{corporation_id}/orders/history/`). */
export const CorporationMarketOrderHistorySchema = z.looseObject({
  order_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  volume_total: z.number(),
  volume_remain: z.number(),
  min_volume: z.number().optional(),
  price: z.number(),
  is_buy_order: z.boolean().optional(),
  issued_by: z.number().optional(),
  region_id: z.number(),
  wallet_division: z.number(),
  duration: z.number(),
  issued: z.string(),
  range: z.string(),
  state: esiEnum(['cancelled', 'expired']),
  escrow: z.number().optional(),
});

/** Structure market order (`GET /markets/structures/{structure_id}/`). */
export const StructureMarketOrderSchema = z.looseObject({
  order_id: z.number(),
  type_id: z.number(),
  location_id: z.number(),
  volume_total: z.number(),
  volume_remain: z.number(),
  min_volume: z.number(),
  price: z.number(),
  is_buy_order: z.boolean(),
  duration: z.number(),
  issued: z.string(),
  range: z.string(),
});

export const MarketHistorySchema = z.looseObject({
  date: z.string(),
  order_count: z.number(),
  volume: z.number(),
  highest: z.number(),
  average: z.number(),
  lowest: z.number(),
});

export const MarketGroupSchema = z.looseObject({
  market_group_id: z.number(),
  name: z.string(),
  description: z.string(),
  types: z.array(z.number()),
  parent_group_id: z.number().optional(),
});

export const MarketPriceSchema = z.looseObject({
  type_id: z.number(),
  average_price: z.number().optional(),
  adjusted_price: z.number().optional(),
});
