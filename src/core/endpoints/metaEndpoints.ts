import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const metaEndpoints = {
  getOpenApiJson: {
    path: 'meta/openapi.json',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
