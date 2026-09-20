import { z } from 'zod';
import {
  LoyaltyPointsSchema,
  LoyaltyStoreOfferSchema,
} from '../schemas/loyalty';

export type LoyaltyPoints = z.infer<typeof LoyaltyPointsSchema>;
export type LoyaltyStoreOffer = z.infer<typeof LoyaltyStoreOfferSchema>;
