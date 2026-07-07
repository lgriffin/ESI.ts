import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { AllianceInfoSchema, AllianceIconSchema } from '../../schemas/alliance';

export const allianceEndpoints = {
  getAllianceById: {
    path: 'alliances/{allianceId}/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['allianceId'],
    responseSchema: AllianceInfoSchema,
  },
  getCorporations: {
    path: 'alliances/{allianceId}/corporations/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['allianceId'],
    responseSchema: z.array(z.number()),
  },
  getIcons: {
    path: 'alliances/{allianceId}/icons/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['allianceId'],
    responseSchema: AllianceIconSchema,
  },
  getAlliances: {
    path: 'alliances',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(z.number()),
  },
} as const satisfies EndpointMap;
