import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const routeEndpoints = {
    getRoute: {
        path: 'route/{origin}/{destination}',
        method: 'GET',
        requiresAuth: false,
        pathParams: ['origin', 'destination'],
    },
} as const satisfies EndpointMap;
