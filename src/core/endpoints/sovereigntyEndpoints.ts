import { EndpointMap } from './EndpointDefinition';

export const sovereigntyEndpoints = {
  getSovereigntyCampaigns: {
    path: 'sovereignty/campaigns',
    method: 'GET',
    requiresAuth: false,
  },
  getSovereigntySystems: {
    path: 'sovereignty/systems',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
