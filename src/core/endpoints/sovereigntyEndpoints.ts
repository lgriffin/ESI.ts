import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  SovereigntyCampaignSchema,
  SovereigntySystemSchema,
} from '../../schemas/sovereignty';

export const sovereigntyEndpoints = {
  getSovereigntyCampaigns: {
    path: 'sovereignty/campaigns',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(SovereigntyCampaignSchema),
  },
  getSovereigntySystems: {
    path: 'sovereignty/systems',
    method: 'GET',
    requiresAuth: false,
    responseSchema: SovereigntySystemSchema,
  },
} as const satisfies EndpointMap;
