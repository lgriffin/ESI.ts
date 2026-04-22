import { EndpointMap } from './EndpointDefinition';

export const sovereigntyEndpoints = {
  getSovereigntyCampaigns: {
    path: 'sovereignty/campaigns',
    method: 'GET',
    requiresAuth: false,
  },
  getSovereigntyMap: {
    path: 'sovereignty/map',
    method: 'GET',
    requiresAuth: false,
  },
  getSovereigntyStructures: {
    path: 'sovereignty/structures',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
