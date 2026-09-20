import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  SovereigntyHubSchema,
  OrbitalSkyhookSchema,
  RaidableSkyhookSchema,
  SkyhookDetailSchema,
  SovereigntyHubDetailSchema,
} from '../../schemas/skyhooks';

export const skyhookEndpoints = {
  getSovereigntyHubs: {
    path: 'corporations/{corporationId}/structures/sovereignty-hubs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(SovereigntyHubSchema),
  },
  getOrbitalSkyhooks: {
    path: 'corporations/{corporationId}/structures/skyhooks',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(OrbitalSkyhookSchema),
  },
  getRaidableSkyhooks: {
    path: 'skyhooks/raidable',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(RaidableSkyhookSchema),
  },
  getSkyhookDetail: {
    path: 'corporations/{corporationId}/structures/skyhooks/{skyhookId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'skyhookId'],
    responseSchema: SkyhookDetailSchema,
  },
  getSovereigntyHubDetail: {
    path: 'corporations/{corporationId}/structures/sovereignty-hubs/{sovereigntyHubId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'sovereigntyHubId'],
    responseSchema: SovereigntyHubDetailSchema,
  },
} as const satisfies EndpointMap;
