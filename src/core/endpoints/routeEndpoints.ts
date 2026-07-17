import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';

export const routeEndpoints = {
  getRoute: {
    path: 'route/{origin}/{destination}',
    method: 'POST',
    requiresAuth: false,
    pathParams: ['origin', 'destination'],
    hasBody: true,
    responseSchema: z.looseObject({ route: z.array(z.number()) }),
  },
} as const satisfies EndpointMap;
