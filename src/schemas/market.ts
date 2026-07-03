import { z } from 'zod';

export const MarketOrderSchema = z.looseObject({
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
  state: z.enum(['open', 'closed', 'expired', 'cancelled']).optional(),
});

export const MarketHistorySchema = z.looseObject({
  date: z.string(),
  order_count: z.number(),
  volume: z.number(),
  highest: z.number(),
  average: z.number(),
  lowest: z.number(),
});
