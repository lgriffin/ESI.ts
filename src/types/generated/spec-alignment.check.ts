/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Compile-time alignment checks between generated spec types and Zod-inferred types.
 *
 * This file is compiled by tsc but never imported at runtime. Each assertion
 * verifies that every field in the generated EsiSpec interface also exists as
 * an explicit key in the corresponding Zod-inferred type. If a Zod schema
 * drops a field that the spec defines, the build fails.
 *
 * Direction: spec keys ⊆ Zod keys (Zod schemas may have extra fields like
 * synthetic IDs; the spec should not have fields the schema doesn't know about).
 */

import type * as EsiSpec from './esi-spec.generated';
import type { AllianceInfo, AllianceIcon } from '../alliance';
import type {
  CharacterInfo,
  CharacterPortrait,
  CharacterAffiliation,
} from '../character';
import type { CorporationInfo } from '../corporation';
import type { MarketOrder, MarketHistory, MarketPrice } from '../market';
import type { ServerStatus } from '../status';
import type { Killmail } from '../killmails';
import type { InsurancePrice } from '../insurance';
import type { Incursion } from '../incursions';
import type { SovereigntyCampaign } from '../sovereignty';

// --- Utility types ---

// Strips index signatures (from z.looseObject) so only explicit keys remain.
type RemoveIndexSignature<T> = {
  [
    K in keyof T as string extends K ? never : number extends K ? never : K
  ]: T[K];
};

// Resolves to `true` when every key in TSpec exists as an explicit key in TZod.
// Resolves to `false` otherwise — which fails the AssertTrue constraint.
type HasAllSpecKeys<TSpec, TZod> = [
  Exclude<keyof TSpec, keyof RemoveIndexSignature<TZod>>,
] extends [never]
  ? true
  : false;

// Fails to compile when T is not `true`.
type AssertTrue<T extends true> = T;

// --- Alignment assertions ---
// Each line links one generated spec interface to its hand-written Zod-inferred type.
// A build failure here means the Zod schema is missing a field the spec defines.

// Alliance
type _AllianceInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.AllianceDetail, AllianceInfo>
>;
type _AllianceIcon = AssertTrue<
  HasAllSpecKeys<EsiSpec.AlliancesAllianceIdIconsGet, AllianceIcon>
>;

// Character
type _CharacterInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersDetail, CharacterInfo>
>;
type _CharacterPortrait = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdPortraitGet, CharacterPortrait>
>;
type _CharacterAffiliation = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersAffiliationPost, CharacterAffiliation>
>;

// Corporation
type _CorporationInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.CorporationsDetail, CorporationInfo>
>;

// Market
type _MarketHistory = AssertTrue<
  HasAllSpecKeys<EsiSpec.MarketsRegionIdHistoryGet, MarketHistory>
>;
type _MarketOrder = AssertTrue<
  HasAllSpecKeys<EsiSpec.MarketsRegionIdOrdersGet, MarketOrder>
>;
type _MarketPrice = AssertTrue<
  HasAllSpecKeys<EsiSpec.MarketsPricesGet, MarketPrice>
>;

// Status
type _ServerStatus = AssertTrue<
  HasAllSpecKeys<EsiSpec.StatusGet, ServerStatus>
>;

// Killmails
type _Killmail = AssertTrue<
  HasAllSpecKeys<EsiSpec.KillmailsKillmailIdKillmailHashGet, Killmail>
>;

// Insurance
type _InsurancePrice = AssertTrue<
  HasAllSpecKeys<EsiSpec.InsurancePricesGet, InsurancePrice>
>;

// Incursions
type _Incursion = AssertTrue<HasAllSpecKeys<EsiSpec.IncursionsGet, Incursion>>;

// Sovereignty
type _SovereigntyCampaign = AssertTrue<
  HasAllSpecKeys<EsiSpec.SovereigntyCampaignsGet, SovereigntyCampaign>
>;
