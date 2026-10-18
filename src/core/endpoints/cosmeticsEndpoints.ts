import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CharacterSkinrSchema,
  CharacterSkinrComponentsSchema,
  SkinrSchema,
} from '../../schemas/cosmetics';

export const cosmeticsEndpoints = {
  getCharacterSkinr: fromOperation('GetCharactersCosmeticsSkinr', {
    pathParams: ['characterId'],
    responseSchema: CharacterSkinrSchema,
  }),
  getCharacterSkinrComponents: fromOperation(
    'GetCharactersCosmeticsSkinrComponents',
    {
      pathParams: ['characterId'],
      responseSchema: CharacterSkinrComponentsSchema,
    },
  ),
  getSkinr: fromOperation('GetCosmeticsSkinr', {
    pathParams: ['skinrId'],
    responseSchema: SkinrSchema,
  }),
} as const satisfies EndpointMap;
