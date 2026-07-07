import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';

export const metaEndpoints = {
  getOpenApiJson: {
    path: 'meta/openapi.json',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.record(z.string(), z.unknown()),
  },
} as const satisfies EndpointMap;
