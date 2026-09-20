import { EndpointMap } from './EndpointDefinition';
import {
  CharacterSkinrSchema,
  CharacterSkinrComponentsSchema,
  SkinrSchema,
} from '../../schemas/cosmetics';

export const cosmeticsEndpoints = {
  getCharacterSkinr: {
    path: 'characters/{characterId}/cosmetics/skinr',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterSkinrSchema,
  },
  getCharacterSkinrComponents: {
    path: 'characters/{characterId}/cosmetics/skinr/components',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterSkinrComponentsSchema,
  },
  getSkinr: {
    path: 'cosmetics/skinr/{skinrId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['skinrId'],
    responseSchema: SkinrSchema,
  },
} as const satisfies EndpointMap;
