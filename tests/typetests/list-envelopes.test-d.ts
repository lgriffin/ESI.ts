/**
 * Type tests for the list endpoints ESI wraps in an object (#638): the
 * client methods resolve to the envelope, not a bare array, and each entry
 * keeps its id fields required.
 */
import { expectType } from 'tsd';
import type { z } from 'zod';

import type {
  AccessListAllianceMember,
  AccessListCharacterMember,
  AccessListCorporationMember,
  AccessListMembership,
  AccessListSummary,
  CharacterAccessListsResponse,
  EsiClient,
  MercenaryDensResponse,
  MercenaryTacticalOperationsResponse,
  OrbitalSkyhooksResponse,
  SovereigntyHubsResponse,
} from '../../src';
import {
  AccessListAllianceMemberSchema,
  AccessListCharacterMemberSchema,
  AccessListCorporationMemberSchema,
  AccessListMembershipSchema,
  AccessListSummarySchema,
  MercenaryTacticalOperationsResponseSchema,
  OrbitalSkyhooksResponseSchema,
} from '../../src/schemas';

declare const client: EsiClient;

expectType<Promise<CharacterAccessListsResponse>>(
  client.accessLists.getCharacterAccessLists(1),
);
expectType<Promise<MercenaryDensResponse>>(
  client.mercenary.getMercenaryDens(1),
);
expectType<Promise<MercenaryTacticalOperationsResponse>>(
  client.mercenary.getMercenaryTacticalOperations(1),
);
expectType<Promise<SovereigntyHubsResponse>>(
  client.skyhooks.getSovereigntyHubs(1),
);
expectType<Promise<OrbitalSkyhooksResponse>>(
  client.skyhooks.getOrbitalSkyhooks(1),
);

declare const lists: CharacterAccessListsResponse;
expectType<AccessListSummary[]>(lists.access_lists);
declare const summary: AccessListSummary;
expectType<number>(summary.id);

declare const membership: AccessListMembership;
expectType<boolean>(membership.allow_everyone);
expectType<AccessListAllianceMember[]>(membership.alliances);
expectType<AccessListCorporationMember[]>(membership.corporations);
expectType<AccessListCharacterMember[]>(membership.characters);

declare const alliance: AccessListAllianceMember;
expectType<number>(alliance.alliance_id);
declare const corporation: AccessListCorporationMember;
expectType<number>(corporation.corporation_id);
declare const character: AccessListCharacterMember;
expectType<number>(character.character_id);

declare const operations: MercenaryTacticalOperationsResponse;
expectType<string>(operations.operations[0]!.id);
expectType<number>(operations.operations[0]!.mercenary_den_id);
declare const dens: MercenaryDensResponse;
expectType<number>(dens.mercenary_dens[0]!.planet_id);
declare const hubs: SovereigntyHubsResponse;
expectType<number>(hubs.sovereignty_hubs[0]!.solar_system_id);
declare const skyhooks: OrbitalSkyhooksResponse;
expectType<number>(skyhooks.skyhooks[0]!.planet_id);

// The schemas infer the same shapes.
expectType<number>(
  ({} as z.infer<typeof AccessListAllianceMemberSchema>).alliance_id,
);
expectType<number>(
  ({} as z.infer<typeof AccessListCharacterMemberSchema>).character_id,
);
expectType<number>(
  ({} as z.infer<typeof AccessListCorporationMemberSchema>).corporation_id,
);
expectType<boolean>(
  ({} as z.infer<typeof AccessListMembershipSchema>).allow_everyone,
);
expectType<z.ZodNumber>(AccessListSummarySchema.shape.id);
expectType<z.ZodString>(
  MercenaryTacticalOperationsResponseSchema.shape.operations.element.shape.id,
);
expectType<z.ZodNumber>(
  OrbitalSkyhooksResponseSchema.shape.skyhooks.element.shape.planet_id,
);
