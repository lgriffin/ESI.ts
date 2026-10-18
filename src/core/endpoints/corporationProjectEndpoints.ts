import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CorporationProjectsListingSchema,
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorsListingSchema,
} from '../../schemas/corporation-projects';

export const corporationProjectEndpoints = {
  getCorporationProjects: fromOperation('GetCorporationsProjectsListing', {
    pathParams: ['corporationId'],
    queryParams: { before: 'before', after: 'after' },
    responseSchema: CorporationProjectsListingSchema,
  }),
  getCorporationProject: fromOperation('GetCorporationsProjectsDetail', {
    pathParams: ['corporationId', 'projectId'],
    responseSchema: CorporationProjectSchema,
  }),
  getCorporationProjectContribution: fromOperation(
    'GetCorporationsProjectsContribution',
    {
      pathParams: ['corporationId', 'projectId', 'characterId'],
      responseSchema: CorporationProjectContributionSchema,
    },
  ),
  getCorporationProjectContributors: fromOperation(
    'GetCorporationsProjectsContributors',
    {
      pathParams: ['corporationId', 'projectId'],
      queryParams: { before: 'before', after: 'after' },
      responseSchema: CorporationProjectContributorsListingSchema,
    },
  ),
} as const satisfies EndpointMap;
