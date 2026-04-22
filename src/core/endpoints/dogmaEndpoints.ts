import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const dogmaEndpoints = {
  getAttributes: {
    path: 'dogma/attributes',
    method: 'GET',
    requiresAuth: false,
  },
  getAttributeById: {
    path: 'dogma/attributes/{attributeId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['attributeId'],
  },
  getEffects: {
    path: 'dogma/effects',
    method: 'GET',
    requiresAuth: false,
  },
  getEffectById: {
    path: 'dogma/effects/{effectId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['effectId'],
  },
  getDynamicItemInfo: {
    path: 'dogma/dynamic/items/{typeId}/{itemId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['typeId', 'itemId'],
  },
} as const satisfies EndpointMap;
