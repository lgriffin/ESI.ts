import { EndpointMap } from './EndpointDefinition';
import {
  MercenaryDensResponseSchema,
  MercenaryTacticalOperationsResponseSchema,
  MercenaryDenDetailSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../../schemas/mercenary';

export const mercenaryEndpoints = {
  getMercenaryDens: {
    path: 'characters/{characterId}/structures/mercenary-dens',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: MercenaryDensResponseSchema,
  },
  getMercenaryTacticalOperations: {
    path: 'characters/{characterId}/mercenary-tactical-operations',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: MercenaryTacticalOperationsResponseSchema,
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
