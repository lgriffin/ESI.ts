import { EndpointMap } from './EndpointDefinition';
import {
  CharacterLocationSchema,
  CharacterOnlineSchema,
  CharacterShipSchema,
} from '../../schemas/location';

export const locationEndpoints = {
  getCharacterLocation: {
    path: 'characters/{characterId}/location',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterLocationSchema,
  },
  getCharacterOnline: {
    path: 'characters/{characterId}/online',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterOnlineSchema,
  },
  getCharacterShip: {
    path: 'characters/{characterId}/ship',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterShipSchema,
  },
} as const satisfies EndpointMap;
