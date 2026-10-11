import { z } from 'zod';
import { esiEnum } from './esiEnum';

const AccessListAccessSchema = esiEnum([
  'Unspecified',
  'Allowed',
  'Blocked',
  'Manager',
  'Admin',
]);

export const AccessListAllianceMemberSchema = z.looseObject({
  alliance_id: z.number(),
  access: AccessListAccessSchema,
});

export const AccessListCorporationMemberSchema = z.looseObject({
  corporation_id: z.number(),
  access: AccessListAccessSchema,
});

export const AccessListCharacterMemberSchema = z.looseObject({
  character_id: z.number(),
  access: AccessListAccessSchema,
});

export const AccessListMembershipSchema = z.looseObject({
  allow_everyone: z.boolean(),
  alliances: z.array(AccessListAllianceMemberSchema),
  corporations: z.array(AccessListCorporationMemberSchema),
  characters: z.array(AccessListCharacterMemberSchema),
});

export const AccessListSchema = z.looseObject({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  membership: AccessListMembershipSchema,
});

/** One entry in `GET /characters/{character_id}/access-lists`. */
export const AccessListSummarySchema = z.looseObject({
  id: z.number(),
});

/** `GET /characters/{character_id}/access-lists`: ESI wraps the list in `access_lists`. */
export const CharacterAccessListsResponseSchema = z.looseObject({
  access_lists: z.array(AccessListSummarySchema),
});
