import { EndpointDefinition, EndpointMap } from './EndpointDefinition';

export const freelanceJobsEndpoints = {
  getFreelanceJobs: {
    path: 'freelance-jobs',
    method: 'GET',
    requiresAuth: false,
    queryParams: { before: 'before', after: 'after' },
  },
  getFreelanceJobById: {
    path: 'freelance-jobs/{jobId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['jobId'],
  },
  getCharacterFreelanceJobs: {
    path: 'characters/{characterId}/freelance-jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { before: 'before', after: 'after' },
  },
  getCharacterFreelanceJobParticipation: {
    path: 'characters/{characterId}/freelance-jobs/{jobId}/participation',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'jobId'],
  },
  getCorporationFreelanceJobs: {
    path: 'corporations/{corporationId}/freelance-jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { before: 'before', after: 'after' },
  },
  getCorporationFreelanceJobParticipants: {
    path: 'corporations/{corporationId}/freelance-jobs/{jobId}/participants',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'jobId'],
  },
} as const satisfies EndpointMap;
