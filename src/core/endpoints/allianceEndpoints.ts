import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { AllianceInfoSchema, AllianceIconSchema } from '../../schemas/alliance';

export const allianceEndpoints = {
  getAllianceById: fromOperation('GetAlliancesAllianceId', {
    trailingSlash: true,
    pathParams: ['allianceId'],
    responseSchema: AllianceInfoSchema,
  }),
  getCorporations: fromOperation('GetAlliancesAllianceIdCorporations', {
    trailingSlash: true,
    pathParams: ['allianceId'],
    responseSchema: z.array(z.number()),
  }),
  getIcons: fromOperation('GetAlliancesAllianceIdIcons', {
    trailingSlash: true,
    pathParams: ['allianceId'],
    responseSchema: AllianceIconSchema,
  }),
  getAlliances: fromOperation('GetAlliances', {
    responseSchema: z.array(z.number()),
  }),
} as const satisfies EndpointMap;
