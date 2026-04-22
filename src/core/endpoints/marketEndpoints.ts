import { EndpointMap } from './EndpointDefinition';

export const marketEndpoints = {
  getCharacterOrders: {
    path: 'characters/{characterId}/orders/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterOrderHistory: {
    path: 'characters/{characterId}/orders/history/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationOrders: {
    path: 'corporations/{corporationId}/orders/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getCorporationOrderHistory: {
    path: 'corporations/{corporationId}/orders/history/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
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
  },
  getMarketHistory: {
    path: 'markets/{regionId}/history/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { typeId: 'type_id' },
  },
  getMarketOrders: {
    path: 'markets/{regionId}/orders/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
    queryParams: { orderType: 'order_type' },
  },
  getMarketTypes: {
    path: 'markets/{regionId}/types/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['regionId'],
  },
} as const satisfies EndpointMap;
