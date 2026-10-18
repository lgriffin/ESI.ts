import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  SovereigntyHubsResponseSchema,
  OrbitalSkyhooksResponseSchema,
  RaidableSkyhooksResponseSchema,
  SkyhookDetailSchema,
  SovereigntyHubDetailSchema,
} from '../../schemas/skyhooks';

export const skyhookEndpoints = {
  getSovereigntyHubs: fromOperation(
    'GetCorporationsStructuresSovereigntyHubsListing',
    {
      pathParams: ['corporationId'],
      responseSchema: SovereigntyHubsResponseSchema,
    },
  ),
  getOrbitalSkyhooks: fromOperation(
    'GetCorporationsStructuresSkyhooksListing',
    {
      pathParams: ['corporationId'],
      responseSchema: OrbitalSkyhooksResponseSchema,
    },
  ),
  getRaidableSkyhooks: fromOperation('GetSkyhooksRaidable', {
    responseSchema: RaidableSkyhooksResponseSchema,
  }),
  getSkyhookDetail: fromOperation('GetCorporationsStructuresSkyhooksDetail', {
    pathParams: ['corporationId', 'skyhookId'],
    responseSchema: SkyhookDetailSchema,
  }),
  getSovereigntyHubDetail: fromOperation(
    'GetCorporationsStructuresSovereigntyHubsDetail',
    {
      pathParams: ['corporationId', 'sovereigntyHubId'],
      responseSchema: SovereigntyHubDetailSchema,
    },
  ),
} as const satisfies EndpointMap;
