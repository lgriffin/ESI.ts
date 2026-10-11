import { EndpointMap } from './EndpointDefinition';
import {
  SovereigntyHubsResponseSchema,
  OrbitalSkyhooksResponseSchema,
  RaidableSkyhooksResponseSchema,
  SkyhookDetailSchema,
  SovereigntyHubDetailSchema,
} from '../../schemas/skyhooks';

export const skyhookEndpoints = {
  getSovereigntyHubs: {
    path: 'corporations/{corporationId}/structures/sovereignty-hubs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: SovereigntyHubsResponseSchema,
  },
  getOrbitalSkyhooks: {
    path: 'corporations/{corporationId}/structures/skyhooks',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: OrbitalSkyhooksResponseSchema,
  },
  getRaidableSkyhooks: {
    path: 'skyhooks/raidable',
    method: 'GET',
    requiresAuth: false,
    responseSchema: RaidableSkyhooksResponseSchema,
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
