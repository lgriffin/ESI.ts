import { z } from 'zod';
import { EndpointMap } from './EndpointDefinition';
import { fromOperation } from './fromOperation';
import {
  CharacterInfoSchema,
  CharacterPortraitSchema,
  AgentResearchSchema,
  BlueprintSchema,
  CorporationHistorySchema,
  JumpFatigueSchema,
  MedalSchema,
  NotificationSchema,
  CharacterTitleSchema,
  CharacterRoleSchema,
  ContactNotificationSchema,
  CharacterAffiliationSchema,
  CspaChargeCostSchema,
} from '../../schemas/character';
import { StandingSchema } from '../../schemas/common';

export const characterEndpoints = {
  getCharacterPublicInfo: fromOperation('GetCharactersDetail', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: CharacterInfoSchema,
  }),
  getAgentsResearch: fromOperation('GetCharactersCharacterIdAgentsResearch', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(AgentResearchSchema),
  }),
  getBlueprints: fromOperation('GetCharactersCharacterIdBlueprints', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(BlueprintSchema),
  }),
  getRoles: fromOperation('GetCharactersCharacterIdRoles', {
    pathParams: ['characterId'],
    responseSchema: CharacterRoleSchema,
  }),
  getStandings: fromOperation('GetCharactersCharacterIdStandings', {
    pathParams: ['characterId'],
    responseSchema: z.array(StandingSchema),
  }),
  getTitles: fromOperation('GetCharactersCharacterIdTitles', {
    pathParams: ['characterId'],
    responseSchema: z.array(CharacterTitleSchema),
  }),
  getContactNotifications: fromOperation(
    'GetCharactersCharacterIdNotificationsContacts',
    {
      trailingSlash: true,
      pathParams: ['characterId'],
      responseSchema: z.array(ContactNotificationSchema),
    },
  ),
  getCorporationHistory: fromOperation(
    'GetCharactersCharacterIdCorporationhistory',
    {
      trailingSlash: true,
      pathParams: ['characterId'],
      responseSchema: z.array(CorporationHistorySchema),
    },
  ),
  getJumpFatigue: fromOperation('GetCharactersCharacterIdFatigue', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: JumpFatigueSchema,
  }),
  getMedals: fromOperation('GetCharactersCharacterIdMedals', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(MedalSchema),
  }),
  getNotifications: fromOperation('GetCharactersCharacterIdNotifications', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: z.array(NotificationSchema),
  }),
  getPortrait: fromOperation('GetCharactersCharacterIdPortrait', {
    trailingSlash: true,
    pathParams: ['characterId'],
    responseSchema: CharacterPortraitSchema,
  }),
  postCharacterAffiliation: fromOperation('PostCharactersAffiliation', {
    responseSchema: z.array(CharacterAffiliationSchema),
    hasBody: true,
  }),
  calculateCspaChargeCost: fromOperation('PostCharactersCharacterIdCspa', {
    trailingSlash: true,
    responseSchema: CspaChargeCostSchema,
    pathParams: ['characterId'],
    hasBody: true,
  }),
} as const satisfies EndpointMap;
