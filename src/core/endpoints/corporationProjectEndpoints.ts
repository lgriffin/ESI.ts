import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  CorporationProjectSchema,
  CorporationProjectContributionSchema,
  CorporationProjectContributorSchema,
} from '../../schemas/corporation-projects';

export const corporationProjectEndpoints = {
  getCorporationProjects: {
    path: 'corporations/{corporationId}/projects',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(CorporationProjectSchema),
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
    responseSchema: z.array(CorporationProjectContributorSchema),
  },
} as const satisfies EndpointMap;
