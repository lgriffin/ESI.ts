import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  MercenaryDenSchema,
  MercenaryTacticalOperationSchema,
  MercenaryDenDetailSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../../schemas/mercenary';

export const mercenaryEndpoints = {
  getMercenaryDens: {
    path: 'characters/{characterId}/structures/mercenary-dens',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MercenaryDenSchema),
  },
  getMercenaryTacticalOperations: {
    path: 'characters/{characterId}/mercenary-tactical-operations',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MercenaryTacticalOperationSchema),
  },
  getMercenaryDenDetail: {
    path: 'characters/{characterId}/structures/mercenary-dens/{mercenaryDenId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'mercenaryDenId'],
    responseSchema: MercenaryDenDetailSchema,
  },
  getMercenaryTacticalOperationDetail: {
    path: 'characters/{characterId}/mercenary-tactical-operations/{operationId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'operationId'],
    responseSchema: MercenaryTacticalOperationDetailSchema,
  },
} as const satisfies EndpointMap;
