import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  LoyaltyPointsSchema,
  LoyaltyStoreOfferSchema,
} from '../../schemas/loyalty';

export const loyaltyEndpoints = {
  getLoyaltyPoints: {
    path: 'characters/{characterId}/loyalty/points',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(LoyaltyPointsSchema),
  },
  getLoyaltyStoreOffers: {
    path: 'loyalty/stores/{corporationId}/offers',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['corporationId'],
    responseSchema: z.array(LoyaltyStoreOfferSchema),
  },
} as const satisfies EndpointMap;
