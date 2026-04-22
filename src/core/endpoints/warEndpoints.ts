import { EndpointMap } from './EndpointDefinition';

export const warEndpoints = {
  getWars: {
    path: 'wars',
    method: 'GET',
    requiresAuth: false,
  },
  getWarById: {
    path: 'wars/{warId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['warId'],
  },
  getWarKillmails: {
    path: 'wars/{warId}/killmails',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['warId'],
  },
} as const satisfies EndpointMap;
