import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  SovereigntyCampaignSchema,
  SovereigntySystemSchema,
} from '../../schemas/sovereignty';

export const sovereigntyEndpoints = {
  getSovereigntyCampaigns: fromOperation('GetSovereigntyCampaigns', {
    responseSchema: z.array(SovereigntyCampaignSchema),
  }),
  getSovereigntySystems: fromOperation('GetSovereigntySystems', {
    responseSchema: SovereigntySystemSchema,
  }),
} as const satisfies EndpointMap;
