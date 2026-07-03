import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  SovereigntyHubSchema,
  OrbitalSkyhookSchema,
  RaidableSkyhookSchema,
} from '../../schemas/skyhooks';

export const skyhookEndpoints = {
  getSovereigntyHubs: {
    path: 'sovereignty/hubs',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(SovereigntyHubSchema),
  },
  getOrbitalSkyhooks: {
    path: 'sovereignty/skyhooks',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(OrbitalSkyhookSchema),
  },
  getRaidableSkyhooks: {
    path: 'sovereignty/skyhooks/raidable',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(RaidableSkyhookSchema),
  },
} as const satisfies EndpointMap;
