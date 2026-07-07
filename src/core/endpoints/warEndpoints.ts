import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { WarSchema } from '../../schemas/wars';
import { KillmailSummarySchema } from '../../schemas/killmails';

export const warEndpoints = {
  getWars: {
    path: 'wars',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(z.number()),
  },
  getWarById: {
    path: 'wars/{warId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['warId'],
    responseSchema: WarSchema,
  },
  getWarKillmails: {
    path: 'wars/{warId}/killmails',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['warId'],
    responseSchema: z.array(KillmailSummarySchema),
  },
} as const satisfies EndpointMap;
