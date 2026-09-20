import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { FittingSchema } from '../../schemas/fittings';

export const fittingEndpoints = {
  getFittings: {
    path: 'characters/{characterId}/fittings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(FittingSchema),
  },
  createFitting: {
    path: 'characters/{characterId}/fittings',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
  },
  deleteFitting: {
    path: 'characters/{characterId}/fittings/{fittingId}',
    method: 'DELETE',
    requiresAuth: true,
    pathParams: ['characterId', 'fittingId'],
  },
} as const satisfies EndpointMap;
