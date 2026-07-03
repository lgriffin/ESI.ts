import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { KillmailSummarySchema, KillmailSchema } from '../../schemas/killmails';

export const killmailEndpoints = {
  getCharacterRecentKillmails: {
    path: 'characters/{characterId}/killmails/recent',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(KillmailSummarySchema),
  },
  getCorporationRecentKillmails: {
    path: 'corporations/{corporationId}/killmails/recent',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['corporationId'],
    responseSchema: z.array(KillmailSummarySchema),
  },
  getKillmail: {
    path: 'killmails/{killmailId}/{killmailHash}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['killmailId', 'killmailHash'],
    responseSchema: KillmailSchema,
  },
} as const satisfies EndpointMap;
