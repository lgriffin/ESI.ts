import { z } from 'zod';
import {
  MarketOrderSchema,
  CharacterMarketOrderSchema,
  CharacterMarketOrderHistorySchema,
  CorporationMarketOrderSchema,
  CorporationMarketOrderHistorySchema,
  StructureMarketOrderSchema,
  MarketHistorySchema,
  MarketPriceSchema,
  MarketGroupSchema,
} from '../schemas/market';

export type MarketOrder = z.infer<typeof MarketOrderSchema>;
export type CharacterMarketOrder = z.infer<typeof CharacterMarketOrderSchema>;
export type CharacterMarketOrderHistory = z.infer<
  typeof CharacterMarketOrderHistorySchema
>;
export type CorporationMarketOrder = z.infer<
  typeof CorporationMarketOrderSchema
>;
export type CorporationMarketOrderHistory = z.infer<
  typeof CorporationMarketOrderHistorySchema
>;
export type StructureMarketOrder = z.infer<typeof StructureMarketOrderSchema>;
export type MarketHistory = z.infer<typeof MarketHistorySchema>;
export type MarketPrice = z.infer<typeof MarketPriceSchema>;
export type MarketGroup = z.infer<typeof MarketGroupSchema>;
