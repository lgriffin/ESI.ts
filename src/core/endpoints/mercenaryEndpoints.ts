import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  MercenaryDensResponseSchema,
  MercenaryTacticalOperationsResponseSchema,
  MercenaryDenDetailSchema,
  MercenaryTacticalOperationDetailSchema,
} from '../../schemas/mercenary';

export const mercenaryEndpoints = {
  getMercenaryDens: fromOperation(
    'GetCharactersStructuresMercenaryDensListing',
    {
      pathParams: ['characterId'],
      responseSchema: MercenaryDensResponseSchema,
    },
  ),
  getMercenaryTacticalOperations: fromOperation(
    'GetCharactersMercenaryTacticalOperationsListing',
    {
      pathParams: ['characterId'],
      responseSchema: MercenaryTacticalOperationsResponseSchema,
    },
  ),
  getMercenaryDenDetail: fromOperation(
    'GetCharactersStructuresMercenaryDensDetail',
    {
      pathParams: ['characterId', 'mercenaryDenId'],
      responseSchema: MercenaryDenDetailSchema,
    },
  ),
  getMercenaryTacticalOperationDetail: fromOperation(
    'GetCharactersMercenaryTacticalOperationsDetail',
    {
      pathParams: ['characterId', 'operationId'],
      responseSchema: MercenaryTacticalOperationDetailSchema,
    },
  ),
} as const satisfies EndpointMap;
