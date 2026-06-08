import { EndpointMap } from './EndpointDefinition';

export const skyhookEndpoints = {
  getSovereigntyHubs: {
    path: 'sovereignty/hubs',
    method: 'GET',
    requiresAuth: false,
  },
  getOrbitalSkyhooks: {
    path: 'sovereignty/skyhooks',
    method: 'GET',
    requiresAuth: false,
  },
  getRaidableSkyhooks: {
    path: 'sovereignty/skyhooks/raidable',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
