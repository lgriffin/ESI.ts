import { z } from 'zod';
import { MarketOrderSchema, MarketHistorySchema } from '../schemas/market';

export type MarketOrder = z.infer<typeof MarketOrderSchema>;
export type MarketHistory = z.infer<typeof MarketHistorySchema>;
