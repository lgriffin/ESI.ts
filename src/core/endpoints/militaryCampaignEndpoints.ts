import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import {
  MilitaryCampaignSchema,
  MilitaryCampaignObjectiveSchema,
  CharacterMilitaryCampaignObjectiveSchema,
} from '../../schemas/military-campaigns';

export const militaryCampaignEndpoints = {
  getMilitaryCampaigns: {
    path: 'military-campaigns',
    method: 'GET',
    requiresAuth: false,
    responseSchema: z.array(MilitaryCampaignSchema),
  },
  getMilitaryCampaign: {
    path: 'military-campaigns/{campaignId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['campaignId'],
    responseSchema: MilitaryCampaignSchema,
  },
  getMilitaryCampaignObjectives: {
    path: 'military-campaigns/{campaignId}/objectives',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['campaignId'],
    responseSchema: z.array(MilitaryCampaignObjectiveSchema),
  },
  getMilitaryCampaignObjective: {
    path: 'military-campaigns/{campaignId}/objectives/{objectiveId}',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['campaignId', 'objectiveId'],
    responseSchema: MilitaryCampaignObjectiveSchema,
  },
  getCharacterMilitaryCampaignObjectives: {
    path: 'characters/{characterId}/military-campaigns/objectives',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId'],
    responseSchema: z.array(CharacterMilitaryCampaignObjectiveSchema),
  },
  getCharacterMilitaryCampaignObjective: {
    path: 'characters/{characterId}/military-campaigns/objectives/{objectiveId}',
    method: 'GET',
    requiresAuth: true,
    pathParams: ['characterId', 'objectiveId'],
    responseSchema: CharacterMilitaryCampaignObjectiveSchema,
  },
} as const satisfies EndpointMap;
