import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const skillEndpoints = {
  getCharacterAttributes: {
    path: 'characters/{characterId}/attributes',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterSkillQueue: {
    path: 'characters/{characterId}/skillqueue',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
  getCharacterSkills: {
    path: 'characters/{characterId}/skills',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
  },
} as const satisfies EndpointMap;
