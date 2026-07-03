import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  FreelanceJobsListingSchema,
  FreelanceJobDetailSchema,
  CharacterFreelanceJobsListingSchema,
  FreelanceJobParticipationSchema,
  CorporationFreelanceJobsListingSchema,
  FreelanceJobParticipantSchema,
} from '../../schemas/freelance-jobs';

export const freelanceJobsEndpoints = {
  getFreelanceJobs: {
    path: 'freelance-jobs',
    method: 'GET',
    requiresAuth: false,
    queryParams: { before: 'before', after: 'after' },
    responseSchema: FreelanceJobsListingSchema,
  },
  getFreelanceJobById: {
    path: 'freelance-jobs/{jobId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['jobId'],
    responseSchema: FreelanceJobDetailSchema,
  },
  getCharacterFreelanceJobs: {
    path: 'characters/{characterId}/freelance-jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    queryParams: { before: 'before', after: 'after' },
    responseSchema: CharacterFreelanceJobsListingSchema,
  },
  getCharacterFreelanceJobParticipation: {
    path: 'characters/{characterId}/freelance-jobs/{jobId}/participation',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'jobId'],
    responseSchema: FreelanceJobParticipationSchema,
  },
  getCorporationFreelanceJobs: {
    path: 'corporations/{corporationId}/freelance-jobs',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    queryParams: { before: 'before', after: 'after' },
    responseSchema: CorporationFreelanceJobsListingSchema,
  },
  getCorporationFreelanceJobParticipants: {
    path: 'corporations/{corporationId}/freelance-jobs/{jobId}/participants',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId', 'jobId'],
    responseSchema: z.array(FreelanceJobParticipantSchema),
  },
} as const satisfies EndpointMap;
