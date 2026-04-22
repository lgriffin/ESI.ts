import { EndpointMap } from './EndpointDefinition';

export const routeEndpoints = {
  getRoute: {
    path: 'route/{origin}/{destination}',
    method: 'POST',
    requiresAuth: false,
    pathParams: ['origin', 'destination'],
    hasBody: true,
  },
} as const satisfies EndpointMap;
