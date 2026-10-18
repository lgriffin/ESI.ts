import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';

export const routeEndpoints = {
  getRoute: fromOperation('PostRoute', {
    pathParams: ['origin', 'destination'],
    hasBody: true,
    responseSchema: z.looseObject({ route: z.array(z.number()) }),
  }),
} as const satisfies EndpointMap;
