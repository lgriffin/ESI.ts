import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { FittingSchema, FittingCreatedSchema } from '../../schemas/fittings';

export const fittingEndpoints = {
  getFittings: fromOperation('GetCharactersCharacterIdFittings', {
    pathParams: ['characterId'],
    responseSchema: z.array(FittingSchema),
  }),
  createFitting: fromOperation('PostCharactersCharacterIdFittings', {
    responseSchema: FittingCreatedSchema,
    pathParams: ['characterId'],
    hasBody: true,
  }),
  deleteFitting: fromOperation('DeleteCharactersCharacterIdFittingsFittingId', {
    pathParams: ['characterId', 'fittingId'],
  }),
} as const satisfies EndpointMap;
