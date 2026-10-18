import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  MilitaryCampaignSchema,
  MilitaryCampaignsResponseSchema,
  MilitaryCampaignObjectiveSchema,
  MilitaryCampaignObjectivesResponseSchema,
  CharacterMilitaryCampaignObjectiveSchema,
  CharacterMilitaryCampaignObjectivesResponseSchema,
} from '../../schemas/military-campaigns';

export const militaryCampaignEndpoints = {
  getMilitaryCampaigns: fromOperation('GetMilitaryCampaignsListing', {
    responseSchema: MilitaryCampaignsResponseSchema,
  }),
  getMilitaryCampaign: fromOperation('GetMilitaryCampaignsDetail', {
    pathParams: ['campaignId'],
    responseSchema: MilitaryCampaignSchema,
  }),
  getMilitaryCampaignObjectives: fromOperation(
    'GetMilitaryCampaignsObjectivesListing',
    {
      pathParams: ['campaignId'],
      queryParams: { after: 'after', before: 'before', limit: 'limit' },
      responseSchema: MilitaryCampaignObjectivesResponseSchema,
    },
  ),
  getMilitaryCampaignObjective: fromOperation(
    'GetMilitaryCampaignsObjectivesDetail',
    {
      pathParams: ['campaignId', 'objectiveId'],
      responseSchema: MilitaryCampaignObjectiveSchema,
    },
  ),
  getCharacterMilitaryCampaignObjectives: fromOperation(
    'GetCharactersMilitaryCampaignsObjectivesListing',
    {
      pathParams: ['characterId'],
      queryParams: { after: 'after', before: 'before', limit: 'limit' },
      responseSchema: CharacterMilitaryCampaignObjectivesResponseSchema,
    },
  ),
  getCharacterMilitaryCampaignObjective: fromOperation(
    'GetCharactersMilitaryCampaignsObjectivesParticipation',
    {
      pathParams: ['characterId', 'objectiveId'],
      responseSchema: CharacterMilitaryCampaignObjectiveSchema,
    },
  ),
} as const satisfies EndpointMap;
