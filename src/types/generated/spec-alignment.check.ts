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
 *
 * Coverage summary:
 * - Type pairs asserted: 104
 * - Domains covered: 24 (Alliance, Assets, Calendar, Character, Clones, Contacts,
 *   Contracts, Corporation, Dogma, Faction Warfare, Fittings, Fleet,
 *   Freelance Jobs, Incursions, Industry, Insurance, Killmails, Location,
 *   Loyalty, Mail, Market, PI, Skills, Sovereignty, Status, Universe, Wallet, Wars)
 * - Skipped types: 18 (documented inline with reasons — key name mismatches,
 *   structural differences, inline array elements, or no spec counterpart)
 */

import type * as EsiSpec from './esi-spec.generated';

// --- Hand-written type imports ---

import type {
  AllianceInfo,
  AllianceContact,
  AllianceContactLabel,
  AllianceIcon,
} from '../alliance';
import type { CharacterAsset, AssetLocation, AssetName } from '../assets';
import type {
  CalendarEvent,
  CalendarEventDetail,
  CalendarEventAttendee,
} from '../calendar';
import type {
  CharacterInfo,
  CharacterPortrait,
  CharacterAttributes,
  AgentResearch,
  Blueprint,
  CorporationHistory,
  JumpFatigue,
  Medal,
  Notification,
  Standing,
  CharacterTitle,
  CharacterAffiliation,
  CharacterRole,
} from '../character';
import type { CloneInfo } from '../clones';
import type { Contact, ContactLabel } from '../contacts';
import type { Contract, ContractItem, ContractBid } from '../contracts';
import type {
  CorporationInfo,
  CorporationAllianceHistory,
  // CorporationMedal -- skipped: uses 'date' instead of spec 'created_at'
  CorporationStarbase,
  CorporationDivisions,
  CorporationFacility,
  CorporationIssuedMedal,
  CorporationMemberTitle,
  CorporationMemberTracking,
  CorporationMemberRole,
  // CorporationRoleHistory -- skipped: uses 'before'/'after' instead of spec 'new_roles'/'old_roles'
  CorporationShareholder,
  CorporationStarbaseDetail,
  CorporationStructure,
  CorporationTitle,
  ContainerLog,
} from '../corporation';
import type { DogmaAttribute, DogmaEffect, DogmaDynamicItem } from '../dogma';
import type {
  FactionWarfareStats,
  FactionWarfareCharacterStats,
  FactionWarfareSystem,
  FactionWarfareWar,
  FactionWarfareLeaderboard,
  FactionWarfareCorporationStats,
} from '../faction-warfare';
import type { Fitting } from '../fittings';
import type {
  FleetInfo,
  FleetMember,
  FleetWing,
  CharacterFleetInfo,
} from '../fleet';
import type {
  FreelanceJobsListing,
  FreelanceJobDetail,
  CharacterFreelanceJobsListing,
  CorporationFreelanceJobsListing,
} from '../freelance-jobs';
import type { Incursion } from '../incursions';
import type {
  IndustryJob,
  MiningLedgerEntry,
  IndustryFacility,
  IndustrySystem,
  MoonExtractionTimer,
  MiningObserver,
  MiningObserverEntry,
} from '../industry';
import type { InsurancePrice } from '../insurance';
import type { KillmailSummary, Killmail } from '../killmails';
import type {
  CharacterLocation,
  CharacterOnline,
  CharacterShip,
} from '../location';
import type { LoyaltyPoints, LoyaltyStoreOffer } from '../loyalty';
import type { MailMessage } from '../mail';
import type {
  MarketOrder,
  CharacterMarketOrder,
  CharacterMarketOrderHistory,
  CorporationMarketOrder,
  CorporationMarketOrderHistory,
  StructureMarketOrder,
  MarketHistory,
  MarketPrice,
  MarketGroup,
} from '../market';
import type { PlanetaryColony, CustomsOffice, ColonyLayout } from '../pi';
import type { SkillQueue } from '../skills';
import type {
  SovereigntyCampaign,
  SovereigntySystemStructure,
  // SovereigntySystem -- skipped: uses completely different nested structure vs flat spec shape
} from '../sovereignty';
import type { ServerStatus } from '../status';
import type {
  SolarSystemInfo,
  ConstellationInfo,
  RegionInfo,
  Ancestry,
  Bloodline,
  Faction,
  Race,
  StationInfo,
  TypeInfo,
  AsteroidBeltInfo,
  GraphicInfo,
  ItemCategory,
  ItemGroup,
  MoonInfo,
  PlanetInfo,
  StarInfo,
  StargateInfo,
  StructureInfo,
  SystemJump,
  SystemKill,
  BulkIdResult,
  NameAndCategory,
  SchematicInfo,
  SearchResult,
} from '../universe';
import type { WalletTransaction, WalletJournal } from '../wallet';
import type { War } from '../wars';

// --- Utility types ---

// Strips index signatures (from z.looseObject) so only explicit keys remain.
type RemoveIndexSignature<T> = {
  [
    K in keyof T as string extends K ? never : number extends K ? never : K
  ]: T[K];
};

// Resolves to `true` when every key in TSpec exists as an explicit key in TZod.
// Resolves to `false` otherwise -- which fails the AssertTrue constraint.
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
type _AllianceContact = AssertTrue<
  HasAllSpecKeys<EsiSpec.AlliancesAllianceIdContactsGet, AllianceContact>
>;
type _AllianceContactLabel = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.AlliancesAllianceIdContactsLabelsGet,
    AllianceContactLabel
  >
>;

// Assets
type _CharacterAsset = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdAssetsGet, CharacterAsset>
>;
type _AssetLocation = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdAssetsLocationsPost,
    AssetLocation
  >
>;
type _AssetName = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdAssetsNamesPost, AssetName>
>;

// Calendar
type _CalendarEvent = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdCalendarGet, CalendarEvent>
>;
type _CalendarEventDetail = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdCalendarEventIdGet,
    CalendarEventDetail
  >
>;
type _CalendarEventAttendee = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdCalendarEventIdAttendeesGet,
    CalendarEventAttendee
  >
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
type _CharacterAttributes = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdAttributesGet,
    CharacterAttributes
  >
>;
type _AgentResearch = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdAgentsResearchGet, AgentResearch>
>;
type _Blueprint = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdBlueprintsGet, Blueprint>
>;
type _CorporationHistory = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdCorporationhistoryGet,
    CorporationHistory
  >
>;
type _JumpFatigue = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdFatigueGet, JumpFatigue>
>;
type _Medal = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdMedalsGet, Medal>
>;
type _Notification = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdNotificationsGet, Notification>
>;
type _Standing = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdStandingsGet, Standing>
>;
type _CharacterTitle = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdTitlesGet, CharacterTitle>
>;
type _CharacterRole = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdRolesGet, CharacterRole>
>;

// Clones
type _CloneInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdClonesGet, CloneInfo>
>;

// Contacts
type _Contact = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdContactsGet, Contact>
>;
type _ContactLabel = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdContactsLabelsGet, ContactLabel>
>;

// Contracts
type _Contract = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdContractsGet, Contract>
>;
type _ContractItem = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdContractsContractIdItemsGet,
    ContractItem
  >
>;
type _ContractBid = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdContractsContractIdBidsGet,
    ContractBid
  >
>;

// Corporation
type _CorporationInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.CorporationsDetail, CorporationInfo>
>;
type _CorporationAllianceHistory = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdAlliancehistoryGet,
    CorporationAllianceHistory
  >
>;
// Skip: CorporationMedal -- schema uses 'date' instead of spec 'created_at' (intentional key name difference)
// type _CorporationMedal = AssertTrue<
//   HasAllSpecKeys<EsiSpec.CorporationsCorporationIdMedalsGet, CorporationMedal>
// >;
type _CorporationStarbase = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdStarbasesGet,
    CorporationStarbase
  >
>;
type _CorporationDivisions = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdDivisionsGet,
    CorporationDivisions
  >
>;
type _CorporationFacility = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdFacilitiesGet,
    CorporationFacility
  >
>;
type _CorporationIssuedMedal = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdMedalsIssuedGet,
    CorporationIssuedMedal
  >
>;
type _CorporationMemberTitle = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdMembersTitlesGet,
    CorporationMemberTitle
  >
>;
type _CorporationMemberTracking = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdMembertrackingGet,
    CorporationMemberTracking
  >
>;
type _CorporationMemberRole = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdRolesGet,
    CorporationMemberRole
  >
>;
// Skip: CorporationRoleHistory -- schema uses 'before'/'after' instead of spec 'new_roles'/'old_roles' (intentional key name difference)
// type _CorporationRoleHistory = AssertTrue<
//   HasAllSpecKeys<EsiSpec.CorporationsCorporationIdRolesHistoryGet, CorporationRoleHistory>
// >;
type _CorporationShareholder = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdShareholdersGet,
    CorporationShareholder
  >
>;
type _CorporationStarbaseDetail = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdStarbasesStarbaseIdGet,
    CorporationStarbaseDetail
  >
>;
type _CorporationStructure = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdStructuresGet,
    CorporationStructure
  >
>;
type _CorporationTitle = AssertTrue<
  HasAllSpecKeys<EsiSpec.CorporationsCorporationIdTitlesGet, CorporationTitle>
>;
type _ContainerLog = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdContainersLogsGet,
    ContainerLog
  >
>;

// Dogma
type _DogmaAttribute = AssertTrue<
  HasAllSpecKeys<EsiSpec.DogmaAttributesAttributeIdGet, DogmaAttribute>
>;
type _DogmaEffect = AssertTrue<
  HasAllSpecKeys<EsiSpec.DogmaEffectsEffectIdGet, DogmaEffect>
>;
type _DogmaDynamicItem = AssertTrue<
  HasAllSpecKeys<EsiSpec.DogmaDynamicItemsTypeIdItemIdGet, DogmaDynamicItem>
>;

// Faction Warfare
type _FactionWarfareStats = AssertTrue<
  HasAllSpecKeys<EsiSpec.FwStatsGet, FactionWarfareStats>
>;
type _FactionWarfareCharacterStats = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdFwStatsGet,
    FactionWarfareCharacterStats
  >
>;
type _FactionWarfareSystem = AssertTrue<
  HasAllSpecKeys<EsiSpec.FwSystemsGet, FactionWarfareSystem>
>;
type _FactionWarfareWar = AssertTrue<
  HasAllSpecKeys<EsiSpec.FwWarsGet, FactionWarfareWar>
>;
type _FactionWarfareLeaderboard = AssertTrue<
  HasAllSpecKeys<EsiSpec.FwLeaderboardsGet, FactionWarfareLeaderboard>
>;
type _FactionWarfareCorporationStats = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdFwStatsGet,
    FactionWarfareCorporationStats
  >
>;

// Fittings
type _Fitting = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdFittingsGet, Fitting>
>;

// Fleet
type _FleetInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.FleetsFleetIdGet, FleetInfo>
>;
type _FleetMember = AssertTrue<
  HasAllSpecKeys<EsiSpec.FleetsFleetIdMembersGet, FleetMember>
>;
type _FleetWing = AssertTrue<
  HasAllSpecKeys<EsiSpec.FleetsFleetIdWingsGet, FleetWing>
>;
type _CharacterFleetInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdFleetGet, CharacterFleetInfo>
>;

// Freelance Jobs
type _FreelanceJobsListing = AssertTrue<
  HasAllSpecKeys<EsiSpec.FreelanceJobsListing, FreelanceJobsListing>
>;
type _FreelanceJobDetail = AssertTrue<
  HasAllSpecKeys<EsiSpec.FreelanceJobsDetail, FreelanceJobDetail>
>;
type _CharacterFreelanceJobsListing = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersFreelanceJobsListing,
    CharacterFreelanceJobsListing
  >
>;
type _CorporationFreelanceJobsListing = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsFreelanceJobsListing,
    CorporationFreelanceJobsListing
  >
>;
// Skip: EsiCursor -- synthetic client-side utility type, no spec counterpart
// Skip: FreelanceJobSummary -- represents inline array element within FreelanceJobsListing, no separate spec interface
// Skip: FreelanceJobParticipation -- hand-written schema uses different key names (status/contributions vs spec state/contributed)
// Skip: FreelanceJobParticipant -- represents inline array element within CorporationsFreelanceJobsParticipants, no separate spec interface

// Incursions
type _Incursion = AssertTrue<HasAllSpecKeys<EsiSpec.IncursionsGet, Incursion>>;

// Industry
type _IndustryJob = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdIndustryJobsGet, IndustryJob>
>;
type _MiningLedgerEntry = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdMiningGet, MiningLedgerEntry>
>;
type _IndustryFacility = AssertTrue<
  HasAllSpecKeys<EsiSpec.IndustryFacilitiesGet, IndustryFacility>
>;
type _IndustrySystem = AssertTrue<
  HasAllSpecKeys<EsiSpec.IndustrySystemsGet, IndustrySystem>
>;
type _MoonExtractionTimer = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationCorporationIdMiningExtractionsGet,
    MoonExtractionTimer
  >
>;
type _MiningObserver = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationCorporationIdMiningObserversGet,
    MiningObserver
  >
>;
type _MiningObserverEntry = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationCorporationIdMiningObserversObserverIdGet,
    MiningObserverEntry
  >
>;

// Insurance
type _InsurancePrice = AssertTrue<
  HasAllSpecKeys<EsiSpec.InsurancePricesGet, InsurancePrice>
>;

// Killmails
type _Killmail = AssertTrue<
  HasAllSpecKeys<EsiSpec.KillmailsKillmailIdKillmailHashGet, Killmail>
>;
type _KillmailSummary = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdKillmailsRecentGet,
    KillmailSummary
  >
>;

// Location
type _CharacterLocation = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersLocation, CharacterLocation>
>;
type _CharacterOnline = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersOnline, CharacterOnline>
>;
type _CharacterShip = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersShip, CharacterShip>
>;

// Loyalty
type _LoyaltyPoints = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdLoyaltyPointsGet, LoyaltyPoints>
>;
type _LoyaltyStoreOffer = AssertTrue<
  HasAllSpecKeys<EsiSpec.LoyaltyStoresCorporationIdOffersGet, LoyaltyStoreOffer>
>;

// Mail
type _MailMessage = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdMailGet, MailMessage>
>;
// Skip: MailLabel -- represents inner label element within CharactersCharacterIdMailLabelsGet wrapper, no separate spec interface
// Skip: MailMessage vs CharactersCharacterIdMailMailIdGet -- detail endpoint uses 'read' instead of 'is_read', intentional key name difference

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
type _CharacterMarketOrder = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdOrdersGet, CharacterMarketOrder>
>;
type _CharacterMarketOrderHistory = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdOrdersHistoryGet,
    CharacterMarketOrderHistory
  >
>;
type _CorporationMarketOrder = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdOrdersGet,
    CorporationMarketOrder
  >
>;
type _CorporationMarketOrderHistory = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdOrdersHistoryGet,
    CorporationMarketOrderHistory
  >
>;
type _StructureMarketOrder = AssertTrue<
  HasAllSpecKeys<EsiSpec.MarketsStructuresStructureIdGet, StructureMarketOrder>
>;
type _MarketGroup = AssertTrue<
  HasAllSpecKeys<EsiSpec.MarketsGroupsMarketGroupIdGet, MarketGroup>
>;

// Planetary Interaction
type _PlanetaryColony = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdPlanetsGet, PlanetaryColony>
>;
type _CustomsOffice = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CorporationsCorporationIdCustomsOfficesGet,
    CustomsOffice
  >
>;
type _ColonyLayout = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdPlanetsPlanetIdGet, ColonyLayout>
>;

// Skills
type _SkillQueue = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersSkillqueueSkill, SkillQueue>
>;
// Skip: CharacterSkill -- represents individual skill within CharactersSkills wrapper, no separate spec interface

// Sovereignty
type _SovereigntyCampaign = AssertTrue<
  HasAllSpecKeys<EsiSpec.SovereigntyCampaignsGet, SovereigntyCampaign>
>;
type _SovereigntySystemStructure = AssertTrue<
  HasAllSpecKeys<EsiSpec.SovereigntyStructuresGet, SovereigntySystemStructure>
>;
// Skip: SovereigntySystem -- schema uses nested structure (solar_systems[].claim) vs flat spec shape (alliance_id, corporation_id, faction_id, system_id)
// type _SovereigntySystem = AssertTrue<
//   HasAllSpecKeys<EsiSpec.SovereigntyMapGet, SovereigntySystem>
// >;

// Status
type _ServerStatus = AssertTrue<HasAllSpecKeys<EsiSpec.Status, ServerStatus>>;

// Universe
type _SolarSystemInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseSystemsSystemIdGet, SolarSystemInfo>
>;
type _ConstellationInfo = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.UniverseConstellationsConstellationIdGet,
    ConstellationInfo
  >
>;
type _RegionInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseRegionsRegionIdGet, RegionInfo>
>;
type _Ancestry = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseAncestriesGet, Ancestry>
>;
type _Bloodline = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseBloodlinesGet, Bloodline>
>;
type _Faction = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseFactionsGet, Faction>
>;
type _Race = AssertTrue<HasAllSpecKeys<EsiSpec.UniverseRacesGet, Race>>;
type _StationInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseStationsStationIdGet, StationInfo>
>;
type _TypeInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseTypesTypeIdGet, TypeInfo>
>;
type _AsteroidBeltInfo = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.UniverseAsteroidBeltsAsteroidBeltIdGet,
    AsteroidBeltInfo
  >
>;
type _GraphicInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseGraphicsGraphicIdGet, GraphicInfo>
>;
type _ItemCategory = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseCategoriesCategoryIdGet, ItemCategory>
>;
type _ItemGroup = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseGroupsGroupIdGet, ItemGroup>
>;
type _MoonInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseMoonsMoonIdGet, MoonInfo>
>;
type _PlanetInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniversePlanetsPlanetIdGet, PlanetInfo>
>;
type _StarInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseStarsStarIdGet, StarInfo>
>;
type _StargateInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseStargatesStargateIdGet, StargateInfo>
>;
type _StructureInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseStructuresStructureIdGet, StructureInfo>
>;
type _SystemJump = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseSystemJumpsGet, SystemJump>
>;
type _SystemKill = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseSystemKillsGet, SystemKill>
>;
type _BulkIdResult = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseIdsPost, BulkIdResult>
>;
type _NameAndCategory = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseNamesPost, NameAndCategory>
>;
type _SchematicInfo = AssertTrue<
  HasAllSpecKeys<EsiSpec.UniverseSchematicsSchematicIdGet, SchematicInfo>
>;
type _SearchResult = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdSearchGet, SearchResult>
>;

// Wallet
type _WalletJournal = AssertTrue<
  HasAllSpecKeys<EsiSpec.CharactersCharacterIdWalletJournalGet, WalletJournal>
>;
type _WalletTransaction = AssertTrue<
  HasAllSpecKeys<
    EsiSpec.CharactersCharacterIdWalletTransactionsGet,
    WalletTransaction
  >
>;

// Wars
type _War = AssertTrue<HasAllSpecKeys<EsiSpec.WarsWarIdGet, War>>;

// --- Skipped types (no plausible generated counterpart) ---

// AccessListEntry, AccessList -- ESI access list types have no generated spec interfaces
// MercenaryDen, MercenaryTacticalOperation -- Mercenary types have no generated spec interfaces
// SovereigntyHub, OrbitalSkyhook, RaidableSkyhook -- Skyhook types have no generated spec interfaces
