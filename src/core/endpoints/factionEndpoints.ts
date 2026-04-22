import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const factionEndpoints = {
  getCharacterStats: {
    path: 'characters/{characterId}/fw/stats',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationStats: {
    path: 'corporations/{corporationId}/fw/stats',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
  },
  getOverall: {
    path: 'fw/leaderboards',
    method: 'GET',
    requiresAuth: false,
  },
  getCharacters: {
    path: 'fw/leaderboards/characters',
    method: 'GET',
    requiresAuth: false,
  },
  getCorporations: {
    path: 'fw/leaderboards/corporations',
    method: 'GET',
    requiresAuth: false,
  },
  getStats: {
    path: 'fw/stats',
    method: 'GET',
    requiresAuth: false,
  },
  getSystems: {
    path: 'fw/systems',
    method: 'GET',
    requiresAuth: false,
  },
  getWars: {
    path: 'fw/wars',
    method: 'GET',
    requiresAuth: false,
  },
} as const satisfies EndpointMap;
