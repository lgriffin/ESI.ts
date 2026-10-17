import { z } from 'zod';
import {
  AccessListAllianceMemberSchema,
  AccessListCharacterMemberSchema,
  AccessListCorporationMemberSchema,
  AccessListMembershipSchema,
  AccessListSchema,
  AccessListSummarySchema,
  CharacterAccessListsResponseSchema,
} from '../schemas/access-lists';

export type AccessListAllianceMember = z.infer<
  typeof AccessListAllianceMemberSchema
>;
export type AccessListCorporationMember = z.infer<
  typeof AccessListCorporationMemberSchema
>;
export type AccessListCharacterMember = z.infer<
  typeof AccessListCharacterMemberSchema
>;
export type AccessListMembership = z.infer<typeof AccessListMembershipSchema>;
export type AccessList = z.infer<typeof AccessListSchema>;
export type AccessListSummary = z.infer<typeof AccessListSummarySchema>;
export type CharacterAccessListsResponse = z.infer<
  typeof CharacterAccessListsResponseSchema
>;
