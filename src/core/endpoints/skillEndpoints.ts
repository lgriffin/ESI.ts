import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  SkillQueueSchema,
  CharacterSkillsResponseSchema,
} from '../../schemas/skills';
import { CharacterAttributesSchema } from '../../schemas/character';

export const skillEndpoints = {
  getCharacterAttributes: fromOperation('GetCharactersCharacterIdAttributes', {
    pathParams: ['characterId'],
    responseSchema: CharacterAttributesSchema,
  }),
  getCharacterSkillQueue: fromOperation('GetCharactersCharacterIdSkillqueue', {
    pathParams: ['characterId'],
    responseSchema: z.array(SkillQueueSchema),
  }),
  getCharacterSkills: fromOperation('GetCharactersCharacterIdSkills', {
    pathParams: ['characterId'],
    responseSchema: CharacterSkillsResponseSchema,
  }),
} as const satisfies EndpointMap;
