import { EndpointMap } from './EndpointDefinition';
import {
  CorporationProjectsListingSchema,
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorsListingSchema,
} from '../../schemas/corporation-projects';

export const corporationProjectEndpoints = {
  getCorporationProjects: {
    path: 'corporations/{corporationId}/projects',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { before: 'before', after: 'after' },
    responseSchema: CorporationProjectsListingSchema,
  },
  getCorporationProject: {
    path: 'corporations/{corporationId}/projects/{projectId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId'],
    responseSchema: CorporationProjectSchema,
  },
  getCorporationProjectContribution: {
    path: 'corporations/{corporationId}/projects/{projectId}/contribution/{characterId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId', 'characterId'],
    responseSchema: CorporationProjectContributionSchema,
  },
  getCorporationProjectContributors: {
    path: 'corporations/{corporationId}/projects/{projectId}/contributors',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'projectId'],
    queryParams: { before: 'before', after: 'after' },
    responseSchema: CorporationProjectContributorsListingSchema,
  },
} as const satisfies EndpointMap;
