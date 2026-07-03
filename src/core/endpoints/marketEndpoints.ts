import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { MarketOrderSchema, MarketHistorySchema } from '../../schemas/market';

export const marketEndpoints = {
  getCharacterOrders: {
    path: 'characters/{characterId}/orders/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MarketOrderSchema),
  },
  getCharacterOrderHistory: {
    path: 'characters/{characterId}/orders/history/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MarketOrderSchema),
  },
  getCorporationOrders: {
    path: 'corporations/{corporationId}/orders/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(MarketOrderSchema),
  },
  getCorporationOrderHistory: {
    path: 'corporations/{corporationId}/orders/history/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(MarketOrderSchema),
  },
  getMarketGroups: {
    path: 'markets/groups/',
    method: 'GET',
    requiresAuth: false,
  },
  getMarketGroupInformation: {
    path: 'markets/groups/{marketGroupId}/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['marketGroupId'],
  },
  getMarketPrices: {
    path: 'markets/prices/',
    method: 'GET',
    requiresAuth: false,
  },
  getMarketOrdersInStructure: {
    path: 'markets/structures/{structureId}/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['structureId'],
    responseSchema: z.array(MarketOrderSchema),
  },
  getMarketHistory: {
    path: 'markets/{regionId}/history/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { typeId: 'type_id' },
    responseSchema: z.array(MarketHistorySchema),
  },
  getMarketOrders: {
    path: 'markets/{regionId}/orders/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { orderType: 'order_type' },
    responseSchema: z.array(MarketOrderSchema),
  },
  getMarketTypes: {
    path: 'markets/{regionId}/types/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
  },
} as const satisfies EndpointMap;
