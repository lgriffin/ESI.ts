import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  MetaChangelogSchema,
  MetaCompatibilityDatesSchema,
  MetaNameSchema,
  MetaStatusSchema,
} from '../../schemas/meta';

export const metaEndpoints = {
  getOpenApiJson: {
    path: 'meta/openapi.json',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.record(z.string(), z.unknown()),
  },
  getOpenApiYaml: {
    path: 'meta/openapi.yaml',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.string(),
    textResponse: { accept: 'application/yaml, text/yaml, text/plain' },
  },
  getChangelog: {
    path: 'meta/changelog',
    method: 'GET',
    requiresAuth: false,
    responseSchema: MetaChangelogSchema,
  },
  getCompatibilityDates: {
    path: 'meta/compatibility-dates',
    method: 'GET',
    requiresAuth: false,
    responseSchema: MetaCompatibilityDatesSchema,
  },
  getName: {
    path: 'meta/name',
    method: 'GET',
    requiresAuth: false,
    responseSchema: MetaNameSchema,
  },
  getStatus: {
    path: 'meta/status',
    method: 'GET',
    requiresAuth: false,
    responseSchema: MetaStatusSchema,
  },
} as const satisfies EndpointMap;
