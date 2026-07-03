import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  MercenaryDenSchema,
  MercenaryTacticalOperationSchema,
} from '../../schemas/mercenary';

export const mercenaryEndpoints = {
  getMercenaryDens: {
    path: 'mercenary/dens',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(MercenaryDenSchema),
  },
  getMercenaryTacticalOperations: {
    path: 'mercenary/operations',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(MercenaryTacticalOperationSchema),
  },
} as const satisfies EndpointMap;
