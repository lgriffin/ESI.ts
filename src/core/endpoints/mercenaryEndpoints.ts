import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  MercenaryDenSchema,
  MercenaryTacticalOperationSchema,
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
} as const satisfies EndpointMap;
