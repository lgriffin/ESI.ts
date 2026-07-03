import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { IncursionSchema } from '../../schemas/incursions';

export const incursionEndpoints = {
  getIncursions: {
    path: 'incursions',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(IncursionSchema),
  },
} as const satisfies EndpointMap;
