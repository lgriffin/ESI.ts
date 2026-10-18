import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CorporationInfoSchema,
  CorporationAllianceHistorySchema,
  ContainerLogSchema,
  CorporationDivisionsSchema,
  CorporationFacilitySchema,
  CorporationMedalSchema,
  CorporationIssuedMedalSchema,
  CorporationMemberTitleSchema,
  CorporationMemberTrackingSchema,
  CorporationMemberRoleSchema,
  CorporationRoleHistorySchema,
  CorporationShareholderSchema,
  CorporationStarbaseSchema,
  CorporationStarbaseDetailSchema,
  CorporationStructureSchema,
  CorporationTitleSchema,
  CorporationIconSchema,
  CorporationStandingSchema,
  CorporationWalletDivisionSchema,
} from '../../schemas/corporation';
import { BlueprintSchema } from '../../schemas/character';

export const corporationEndpoints = {
  getCorporationInfo: fromOperation('GetCorporationsCorporationId', {
    pathParams: ['corporationId'],
    responseSchema: CorporationInfoSchema,
  }),
  getCorporationAllianceHistory: fromOperation(
    'GetCorporationsCorporationIdAlliancehistory',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationAllianceHistorySchema),
    },
  ),
  getCorporationBlueprints: fromOperation(
    'GetCorporationsCorporationIdBlueprints',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(BlueprintSchema),
    },
  ),
  getCorporationAlscLogs: fromOperation(
    'GetCorporationsCorporationIdContainersLogs',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(ContainerLogSchema),
    },
  ),
  getCorporationDivisions: fromOperation(
    'GetCorporationsCorporationIdDivisions',
    {
      pathParams: ['corporationId'],
      responseSchema: CorporationDivisionsSchema,
    },
  ),
  getCorporationFacilities: fromOperation(
    'GetCorporationsCorporationIdFacilities',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationFacilitySchema),
    },
  ),
  getCorporationIcon: fromOperation('GetCorporationsCorporationIdIcons', {
    pathParams: ['corporationId'],
    responseSchema: CorporationIconSchema,
  }),
  getCorporationMedals: fromOperation('GetCorporationsCorporationIdMedals', {
    pathParams: ['corporationId'],
    responseSchema: z.array(CorporationMedalSchema),
  }),
  getCorporationIssuedMedals: fromOperation(
    'GetCorporationsCorporationIdMedalsIssued',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationIssuedMedalSchema),
    },
  ),
  getCorporationMembers: fromOperation('GetCorporationsCorporationIdMembers', {
    pathParams: ['corporationId'],
    responseSchema: z.array(z.number()),
  }),
  getCorporationMemberLimit: fromOperation(
    'GetCorporationsCorporationIdMembersLimit',
    {
      pathParams: ['corporationId'],
      responseSchema: z.number(),
    },
  ),
  getCorporationMembersTitles: fromOperation(
    'GetCorporationsCorporationIdMembersTitles',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationMemberTitleSchema),
    },
  ),
  getCorporationMemberTracking: fromOperation(
    'GetCorporationsCorporationIdMembertracking',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationMemberTrackingSchema),
    },
  ),
  getCorporationMemberRoles: fromOperation(
    'GetCorporationsCorporationIdRoles',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationMemberRoleSchema),
    },
  ),
  getCorporationMemberRolesHistory: fromOperation(
    'GetCorporationsCorporationIdRolesHistory',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationRoleHistorySchema),
    },
  ),
  getCorporationShareholders: fromOperation(
    'GetCorporationsCorporationIdShareholders',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationShareholderSchema),
    },
  ),
  getCorporationStandings: fromOperation(
    'GetCorporationsCorporationIdStandings',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationStandingSchema),
    },
  ),
  getCorporationStarbases: fromOperation(
    'GetCorporationsCorporationIdStarbases',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationStarbaseSchema),
    },
  ),
  getCorporationStarbaseDetail: fromOperation(
    'GetCorporationsCorporationIdStarbasesStarbaseId',
    {
      pathParams: ['corporationId', 'starbaseId'],
      responseSchema: CorporationStarbaseDetailSchema,
    },
  ),
  getCorporationStructures: fromOperation(
    'GetCorporationsCorporationIdStructures',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(CorporationStructureSchema),
    },
  ),
  getCorporationTitles: fromOperation('GetCorporationsCorporationIdTitles', {
    pathParams: ['corporationId'],
    responseSchema: z.array(CorporationTitleSchema),
  }),
  getNpcCorporations: fromOperation('GetCorporationsNpccorps', {
    responseSchema: z.array(z.number()),
  }),
} as const satisfies EndpointMap;
