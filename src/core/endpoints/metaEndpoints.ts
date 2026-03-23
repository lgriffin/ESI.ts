import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const metaEndpoints = {
    getSwaggerJson: {
        path: 'meta/swagger.json',
        method: 'GET',
        requiresAuth: false,
    },
} as const satisfies EndpointMap;
