import { EndpointMap } from './EndpointDefinition';

export const loyaltyEndpoints = {
  getLoyaltyPoints: {
    path: 'characters/{characterId}/loyalty/points',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getLoyaltyStoreOffers: {
    path: 'loyalty/stores/{corporationId}/offers',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['corporationId'],
  },
} as const satisfies EndpointMap;
