import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import { KillmailSummarySchema, KillmailSchema } from '../../schemas/killmails';

export const killmailEndpoints = {
  getCharacterRecentKillmails: fromOperation(
    'GetCharactersCharacterIdKillmailsRecent',
    {
      pathParams: ['characterId'],
      responseSchema: z.array(KillmailSummarySchema),
    },
  ),
  getCorporationRecentKillmails: fromOperation(
    'GetCorporationsCorporationIdKillmailsRecent',
    {
      pathParams: ['corporationId'],
      responseSchema: z.array(KillmailSummarySchema),
    },
  ),
  getKillmail: fromOperation('GetKillmailsKillmailIdKillmailHash', {
    pathParams: ['killmailId', 'killmailHash'],
    responseSchema: KillmailSchema,
  }),
} as const satisfies EndpointMap;
