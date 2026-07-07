import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  DogmaAttributeSchema,
  DogmaEffectSchema,
  DogmaDynamicItemSchema,
} from '../../schemas/dogma';

export const dogmaEndpoints = {
  getAttributes: {
    path: 'dogma/attributes',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(z.number()),
  },
  getAttributeById: {
    path: 'dogma/attributes/{attributeId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['attributeId'],
    responseSchema: DogmaAttributeSchema,
  },
  getEffects: {
    path: 'dogma/effects',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(z.number()),
  },
  getEffectById: {
    path: 'dogma/effects/{effectId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['effectId'],
    responseSchema: DogmaEffectSchema,
  },
  getDynamicItemInfo: {
    path: 'dogma/dynamic/items/{typeId}/{itemId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['typeId', 'itemId'],
    responseSchema: DogmaDynamicItemSchema,
  },
} as const satisfies EndpointMap;
