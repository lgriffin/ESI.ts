import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { WarSchema } from '../../schemas/wars';
import { KillmailSummarySchema } from '../../schemas/killmails';

export const warEndpoints = {
  getWars: fromOperation('GetWars', {
    responseSchema: z.array(z.number()),
  }),
  getWarById: fromOperation('GetWarsWarId', {
    pathParams: ['warId'],
    responseSchema: WarSchema,
  }),
  getWarKillmails: fromOperation('GetWarsWarIdKillmails', {
    pathParams: ['warId'],
    responseSchema: z.array(KillmailSummarySchema),
  }),
} as const satisfies EndpointMap;
