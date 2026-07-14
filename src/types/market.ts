import { z } from 'zod';
import {
  MarketOrderSchema,
  MarketHistorySchema,
  MarketPriceSchema,
} from '../schemas/market';

export type MarketOrder = z.infer<typeof MarketOrderSchema>;
export type MarketHistory = z.infer<typeof MarketHistorySchema>;
export type MarketPrice = z.infer<typeof MarketPriceSchema>;
