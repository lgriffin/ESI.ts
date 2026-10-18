import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CharacterLocationSchema,
  CharacterOnlineSchema,
  CharacterShipSchema,
} from '../../schemas/location';

export const locationEndpoints = {
  getCharacterLocation: fromOperation('GetCharactersCharacterIdLocation', {
    pathParams: ['characterId'],
    responseSchema: CharacterLocationSchema,
  }),
  getCharacterOnline: fromOperation('GetCharactersCharacterIdOnline', {
    pathParams: ['characterId'],
    responseSchema: CharacterOnlineSchema,
  }),
  getCharacterShip: fromOperation('GetCharactersCharacterIdShip', {
    pathParams: ['characterId'],
    responseSchema: CharacterShipSchema,
  }),
} as const satisfies EndpointMap;
