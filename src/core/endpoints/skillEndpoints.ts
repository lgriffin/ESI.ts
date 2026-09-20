import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  SkillQueueSchema,
  CharacterSkillsResponseSchema,
} from '../../schemas/skills';
import { CharacterAttributesSchema } from '../../schemas/character';

export const skillEndpoints = {
  getCharacterAttributes: {
    path: 'characters/{characterId}/attributes',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterAttributesSchema,
  },
  getCharacterSkillQueue: {
    path: 'characters/{characterId}/skillqueue',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(SkillQueueSchema),
  },
  getCharacterSkills: {
    path: 'characters/{characterId}/skills',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: CharacterSkillsResponseSchema,
  },
} as const satisfies EndpointMap;
