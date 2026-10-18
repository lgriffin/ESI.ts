import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { CloneInfoSchema } from '../../schemas/clones';

export const cloneEndpoints = {
  getClones: fromOperation('GetCharactersCharacterIdClones', {
    pathParams: ['characterId'],
    responseSchema: CloneInfoSchema,
  }),
  getImplants: fromOperation('GetCharactersCharacterIdImplants', {
    pathParams: ['characterId'],
    responseSchema: z.array(z.number()),
  }),
} as const satisfies EndpointMap;
