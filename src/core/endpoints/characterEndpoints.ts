import { EndpointMap } from './EndpointDefinition';

export const characterEndpoints = {
  getCharacterPublicInfo: {
    path: 'characters/{characterId}/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['characterId'],
  },
  getAgentsResearch: {
    path: 'characters/{characterId}/agents_research/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getBlueprints: {
    path: 'characters/{characterId}/blueprints/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getRoles: {
    path: 'characters/{characterId}/roles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getStandings: {
    path: 'characters/{characterId}/standings',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getTitles: {
    path: 'characters/{characterId}/titles',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getContactNotifications: {
    path: 'characters/{characterId}/notifications/contacts/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCorporationHistory: {
    path: 'characters/{characterId}/corporationhistory/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getJumpFatigue: {
    path: 'characters/{characterId}/fatigue/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getMedals: {
    path: 'characters/{characterId}/medals/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getNotifications: {
    path: 'characters/{characterId}/notifications/',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getPortrait: {
    path: 'characters/{characterId}/portrait/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['characterId'],
  },
  postCharacterAffiliation: {
    path: 'characters/affiliation',
    method: 'POST',
    requiresAuth: false,
    hasBody: true,
  },
  calculateCspaChargeCost: {
    path: 'characters/{characterId}/cspa/',
    method: 'POST',
    requiresAuth: true,
    pathParams: ['characterId'],
    hasBody: true,
  },
} as const satisfies EndpointMap;
