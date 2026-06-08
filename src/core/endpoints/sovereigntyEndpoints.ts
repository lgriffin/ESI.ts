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
    deprecated: {
      message: 'Use getSovereigntySystems instead',
      replacedBy: 'getSovereigntySystems',
      sunsetDate: '2026-05-19',
    },
  },
  getSovereigntyStructures: {
    path: 'sovereignty/structures',
    method: 'GET',
    requiresAuth: false,
    deprecated: {
      message: 'Use getSovereigntySystems instead',
      replacedBy: 'getSovereigntySystems',
      sunsetDate: '2026-05-19',
    },
  },
  getSovereigntySystems: {
    path: 'sovereignty/systems',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
