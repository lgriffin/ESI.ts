import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  LoyaltyPointsSchema,
  LoyaltyStoreOfferSchema,
} from '../../schemas/loyalty';

export const loyaltyEndpoints = {
  getLoyaltyPoints: fromOperation('GetCharactersCharacterIdLoyaltyPoints', {
    pathParams: ['characterId'],
    responseSchema: z.array(LoyaltyPointsSchema),
  }),
  getLoyaltyStoreOffers: fromOperation('GetLoyaltyStoresCorporationIdOffers', {
    pathParams: ['corporationId'],
    responseSchema: z.array(LoyaltyStoreOfferSchema),
  }),
} as const satisfies EndpointMap;
