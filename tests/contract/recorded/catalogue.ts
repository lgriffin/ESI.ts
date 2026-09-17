/**
 * What can be recorded, and how.
 *
 * `publicGetEndpoints()` reads the real endpoint maps in
 * src/core/endpoints/, so the coverage check follows the code rather than a
 * list kept by hand. `RECIPES` says, for each public GET endpoint, which
 * public client method reaches it and with which arguments. Arguments come
 * from `SEEDS` (well-known public IDs) or from IDs derived from responses
 * recorded earlier in the same run; recipes run in the order listed.
 */
import * as fs from 'fs';
import * as path from 'path';
import type { EndpointDefinition } from '../../../src/core/endpoints/EndpointDefinition';

const ENDPOINTS_DIR = path.resolve(__dirname, '../../../src/core/endpoints');

export interface PublicEndpoint {
  key: string;
  definition: EndpointDefinition;
}

/** Every GET endpoint definition with `requiresAuth: false`, keyed `<file stem>.<name>`. */
export function publicGetEndpoints(): PublicEndpoint[] {
  const out: PublicEndpoint[] = [];
  const files = fs
    .readdirSync(ENDPOINTS_DIR)
    .filter((f) => /Endpoints\.ts$/.test(f))
    .sort();
  for (const file of files) {
    const stem = file.replace(/Endpoints\.ts$/, '');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(ENDPOINTS_DIR, file)) as Record<
      string,
      Record<string, EndpointDefinition>
    >;
    for (const map of Object.values(mod)) {
      if (map === null || typeof map !== 'object') continue;
      for (const [name, definition] of Object.entries(map)) {
        if (definition.method === 'GET' && definition.requiresAuth === false) {
          out.push({ key: `${stem}.${name}`, definition });
        }
      }
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

/** Well-known public IDs. None belongs to a player account. */
export const SEEDS = {
  /** C C P Alliance Holding, CCP's public holding corporation. */
  ccpCorporationId: 98356193,
  /** CCP's alliance. */
  ccpAllianceId: 434243723,
  /** Caldari Navy, an NPC corporation with a loyalty store. */
  npcLoyaltyCorporationId: 1000035,
  jitaSystemId: 30000142,
  theForgeRegionId: 10000002,
  tritaniumTypeId: 34,
  /** Minerals market group. */
  mineralsMarketGroupId: 1857,
  /** Material category. */
  materialCategoryId: 4,
  /** Mineral item group. */
  mineralGroupId: 18,
  /** Superconductors. */
  schematicId: 65,
  /** Damage Modifier attribute. */
  dogmaAttributeId: 64,
  /** Online effect. */
  dogmaEffectId: 16,
  /** An asteroid belt in Perimeter (Jita has none). */
  asteroidBeltId: 40009232,
  /** A concluded war that has killmails, so its killmail list is stable. */
  warWithKillmailsId: 700000,
} as const;

export type Id = string | number;
/** Derived IDs; a list offers alternatives the recorder tries in turn. */
export type Ids = Record<string, Id | Id[]>;

export interface Recipe {
  endpoint: string;
  client: string;
  method: string;
  /**
   * Arguments for attempt `attempt` (0-based). Throws MissingId when an ID it
   * needs was not derived. The recorder tries the next attempt when ESI
   * answers 204 or 404, while alternatives last.
   */
  args: (ids: Ids, attempt: number) => unknown[];
  /** IDs later recipes can use, read from the full (untruncated) first page. */
  derive?: (body: unknown, upstreamPages: number) => Ids;
  /**
   * Look further for IDs before recording, with GETs that are not recorded
   * (for example the last page of a paginated list).
   */
  prepare?: (
    ids: Ids,
    get: (relative: string) => Promise<unknown>,
  ) => Promise<Ids>;
  /** An empty array is recorded only when no alternative gives a non-empty one. */
  preferNonEmpty?: boolean;
  /** Alternatives to try (default 3). */
  attempts?: number;
}

export class MissingId extends Error {
  constructor(public readonly id: string) {
    super(`needs '${id}', which no earlier recording provided`);
  }
}

function need(ids: Ids, id: string, attempt = 0): Id {
  const raw = ids[id];
  const value = Array.isArray(raw)
    ? raw[attempt]
    : attempt === 0
      ? raw
      : undefined;
  if (value === undefined) throw new MissingId(id);
  return value;
}

type Row = Record<string, unknown>;
const all = <T>(body: unknown, pick: (row: Row) => T | undefined): T[] =>
  Array.isArray(body)
    ? (body as Row[]).map(pick).filter((v): v is T => v !== undefined)
    : [];
const first = <T>(body: unknown, pick: (row: Row) => T | undefined) =>
  all(body, pick)[0];
const isId = (v: unknown): v is Id =>
  typeof v === 'number' || typeof v === 'string';
const defined = (ids: Record<string, unknown>): Ids =>
  Object.fromEntries(
    Object.entries(ids).filter(
      ([, v]) => isId(v) || (Array.isArray(v) && v.length > 0 && v.every(isId)),
    ),
  ) as Ids;

const none = () => [];
const S = SEEDS;

export const RECIPES: Recipe[] = [
  // Status and meta
  {
    endpoint: 'status.getStatus',
    client: 'status',
    method: 'getStatus',
    args: none,
  },
  {
    endpoint: 'meta.getStatus',
    client: 'meta',
    method: 'getStatus',
    args: none,
  },
  { endpoint: 'meta.getName', client: 'meta', method: 'getName', args: none },
  {
    endpoint: 'meta.getChangelog',
    client: 'meta',
    method: 'getChangelog',
    args: none,
  },
  {
    endpoint: 'meta.getCompatibilityDates',
    client: 'meta',
    method: 'getCompatibilityDates',
    args: none,
  },
  {
    endpoint: 'meta.getOpenApiJson',
    client: 'meta',
    method: 'getOpenApiJson',
    args: none,
  },

  // Alliances, corporations, characters
  {
    endpoint: 'alliance.getAlliances',
    client: 'alliance',
    method: 'getAlliances',
    args: none,
  },
  {
    endpoint: 'alliance.getAllianceById',
    client: 'alliance',
    method: 'getAllianceById',
    args: () => [S.ccpAllianceId],
  },
  {
    endpoint: 'alliance.getCorporations',
    client: 'alliance',
    method: 'getCorporations',
    args: () => [S.ccpAllianceId],
  },
  {
    endpoint: 'alliance.getIcons',
    client: 'alliance',
    method: 'getIcons',
    args: () => [S.ccpAllianceId],
  },
  {
    endpoint: 'corporation.getCorporationInfo',
    client: 'corporations',
    method: 'getCorporationInfo',
    args: () => [S.ccpCorporationId],
    derive: (body) => defined({ ccpCeoId: (body as Row)?.ceo_id }),
  },
  {
    endpoint: 'corporation.getCorporationAllianceHistory',
    client: 'corporations',
    method: 'getCorporationAllianceHistory',
    args: () => [S.ccpCorporationId],
  },
  {
    endpoint: 'corporation.getCorporationIcon',
    client: 'corporations',
    method: 'getCorporationIcon',
    args: () => [S.ccpCorporationId],
  },
  {
    endpoint: 'corporation.getNpcCorporations',
    client: 'corporations',
    method: 'getNpcCorporations',
    args: none,
  },
  {
    endpoint: 'character.getCharacterPublicInfo',
    client: 'characters',
    method: 'getCharacterPublicInfo',
    args: (ids) => [need(ids, 'ccpCeoId')],
  },
  {
    endpoint: 'character.getCorporationHistory',
    client: 'characters',
    method: 'getCharacterCorporationHistory',
    args: (ids) => [need(ids, 'ccpCeoId')],
  },
  {
    endpoint: 'character.getPortrait',
    client: 'characters',
    method: 'getCharacterPortrait',
    args: (ids) => [need(ids, 'ccpCeoId')],
  },

  // Universe
  {
    endpoint: 'universe.getSystemById',
    client: 'universe',
    method: 'getSystemById',
    args: () => [S.jitaSystemId],
    derive: (body) => {
      const sys = body as Row;
      const planets = (sys?.planets as Row[] | undefined) ?? [];
      return defined({
        jitaConstellationId: sys?.constellation_id,
        jitaStarId: sys?.star_id,
        jitaStargateId: (sys?.stargates as number[] | undefined)?.[0],
        jitaStationId: (sys?.stations as number[] | undefined)?.[0],
        jitaPlanetId: planets[0]?.planet_id,
        jitaMoonId: first(
          planets,
          (p) => (p.moons as number[] | undefined)?.[0],
        ),
      });
    },
  },
  {
    endpoint: 'universe.getSystems',
    client: 'universe',
    method: 'getSystems',
    args: none,
  },
  {
    endpoint: 'universe.getConstellationById',
    client: 'universe',
    method: 'getConstellationById',
    args: (ids) => [need(ids, 'jitaConstellationId')],
  },
  {
    endpoint: 'universe.getConstellations',
    client: 'universe',
    method: 'getConstellations',
    args: none,
  },
  {
    endpoint: 'universe.getRegionById',
    client: 'universe',
    method: 'getRegionById',
    args: () => [S.theForgeRegionId],
  },
  {
    endpoint: 'universe.getRegions',
    client: 'universe',
    method: 'getRegions',
    args: none,
  },
  {
    endpoint: 'universe.getStarById',
    client: 'universe',
    method: 'getStarById',
    args: (ids) => [need(ids, 'jitaStarId')],
  },
  {
    endpoint: 'universe.getStargateById',
    client: 'universe',
    method: 'getStargateById',
    args: (ids) => [need(ids, 'jitaStargateId')],
  },
  {
    endpoint: 'universe.getStationById',
    client: 'universe',
    method: 'getStationById',
    args: (ids) => [need(ids, 'jitaStationId')],
  },
  {
    endpoint: 'universe.getPlanetById',
    client: 'universe',
    method: 'getPlanetById',
    args: (ids) => [need(ids, 'jitaPlanetId')],
  },
  {
    endpoint: 'universe.getMoonById',
    client: 'universe',
    method: 'getMoonById',
    args: (ids) => [need(ids, 'jitaMoonId')],
  },
  {
    endpoint: 'universe.getAsteroidBeltInfo',
    client: 'universe',
    method: 'getAsteroidBeltInfo',
    args: () => [S.asteroidBeltId],
  },
  {
    endpoint: 'universe.getTypeById',
    client: 'universe',
    method: 'getTypeById',
    args: () => [S.tritaniumTypeId],
    derive: (body) =>
      defined({ tritaniumGraphicId: (body as Row)?.graphic_id }),
  },
  {
    endpoint: 'universe.getTypes',
    client: 'universe',
    method: 'getTypes',
    args: none,
  },
  {
    endpoint: 'universe.getItemGroupById',
    client: 'universe',
    method: 'getItemGroupById',
    args: () => [S.mineralGroupId],
  },
  {
    endpoint: 'universe.getItemGroups',
    client: 'universe',
    method: 'getItemGroups',
    args: none,
  },
  {
    endpoint: 'universe.getCategoryById',
    client: 'universe',
    method: 'getItemCategoryById',
    args: () => [S.materialCategoryId],
  },
  {
    endpoint: 'universe.getCategories',
    client: 'universe',
    method: 'getItemCategories',
    args: none,
  },
  {
    endpoint: 'universe.getGraphics',
    client: 'universe',
    method: 'getGraphics',
    args: none,
    derive: (body) =>
      defined({ graphicId: (body as number[] | undefined)?.[0] }),
  },
  {
    endpoint: 'universe.getGraphicById',
    client: 'universe',
    method: 'getGraphicById',
    args: (ids) => [
      'tritaniumGraphicId' in ids
        ? need(ids, 'tritaniumGraphicId')
        : need(ids, 'graphicId'),
    ],
  },
  {
    endpoint: 'universe.getSchematicById',
    client: 'universe',
    method: 'getSchematicById',
    args: () => [S.schematicId],
  },
  {
    endpoint: 'pi.getSchematicInformation',
    client: 'pi',
    method: 'getSchematicInformation',
    args: () => [S.schematicId],
  },
  {
    endpoint: 'universe.getAncestries',
    client: 'universe',
    method: 'getAncestries',
    args: none,
  },
  {
    endpoint: 'universe.getBloodlines',
    client: 'universe',
    method: 'getBloodlines',
    args: none,
  },
  {
    endpoint: 'universe.getFactions',
    client: 'universe',
    method: 'getFactions',
    args: none,
  },
  {
    endpoint: 'universe.getRaces',
    client: 'universe',
    method: 'getRaces',
    args: none,
  },
  {
    endpoint: 'universe.getStructures',
    client: 'universe',
    method: 'getStructures',
    args: none,
  },
  {
    endpoint: 'universe.getSystemJumps',
    client: 'universe',
    method: 'getSystemJumps',
    args: none,
  },
  {
    endpoint: 'universe.getSystemKills',
    client: 'universe',
    method: 'getSystemKills',
    args: none,
  },

  // Dogma
  {
    endpoint: 'dogma.getAttributes',
    client: 'dogma',
    method: 'getAttributes',
    args: none,
  },
  {
    endpoint: 'dogma.getAttributeById',
    client: 'dogma',
    method: 'getAttributeById',
    args: () => [S.dogmaAttributeId],
  },
  {
    endpoint: 'dogma.getEffects',
    client: 'dogma',
    method: 'getEffects',
    args: none,
  },
  {
    endpoint: 'dogma.getEffectById',
    client: 'dogma',
    method: 'getEffectById',
    args: () => [S.dogmaEffectId],
  },

  // Market
  {
    endpoint: 'market.getMarketPrices',
    client: 'market',
    method: 'getMarketPrices',
    args: none,
  },
  {
    endpoint: 'market.getMarketGroups',
    client: 'market',
    method: 'getMarketGroups',
    args: none,
  },
  {
    endpoint: 'market.getMarketGroupInformation',
    client: 'market',
    method: 'getMarketGroupInformation',
    args: () => [S.mineralsMarketGroupId],
  },
  {
    endpoint: 'market.getMarketHistory',
    client: 'market',
    method: 'getMarketHistory',
    args: () => [S.theForgeRegionId, S.tritaniumTypeId],
  },
  {
    endpoint: 'market.getMarketOrders',
    client: 'market',
    method: 'getMarketOrders',
    args: () => [S.theForgeRegionId],
  },
  {
    endpoint: 'market.getMarketTypes',
    client: 'market',
    method: 'getMarketTypes',
    args: () => [S.theForgeRegionId],
  },

  // Contracts
  {
    endpoint: 'contract.getPublicContracts',
    client: 'contracts',
    method: 'getPublicContracts',
    args: () => [S.theForgeRegionId],
    derive: (body, upstreamPages) =>
      defined({
        publicContractPages: upstreamPages,
        itemExchangeContractIds: all(body, (c) =>
          c.type === 'item_exchange' ? (c.contract_id as number) : undefined,
        ).slice(0, 3),
      }),
  },
  {
    endpoint: 'contract.getPublicContractBids',
    client: 'contracts',
    method: 'getPublicContractBids',
    // ESI lists auctions after item exchanges, so look on the last page.
    prepare: async (ids, get) => {
      const last = need(ids, 'publicContractPages');
      const body = await get(
        `contracts/public/${S.theForgeRegionId}?page=${last}`,
      );
      return defined({
        auctionContractIds: all(body, (c) =>
          c.type === 'auction' ? (c.contract_id as number) : undefined,
        ).slice(0, 12),
      });
    },
    preferNonEmpty: true,
    attempts: 12,
    args: (ids, attempt) => [need(ids, 'auctionContractIds', attempt)],
  },
  {
    endpoint: 'contract.getPublicContractItems',
    client: 'contracts',
    method: 'getPublicContractItems',
    args: (ids, attempt) => [need(ids, 'itemExchangeContractIds', attempt)],
  },

  // Wars and killmails
  {
    endpoint: 'war.getWars',
    client: 'wars',
    method: 'getWars',
    args: none,
  },
  {
    endpoint: 'war.getWarById',
    client: 'wars',
    method: 'getWarById',
    args: () => [S.warWithKillmailsId],
  },
  {
    endpoint: 'war.getWarKillmails',
    client: 'wars',
    method: 'getWarKillmails',
    args: () => [S.warWithKillmailsId],
    derive: (body) => {
      const km = Array.isArray(body) ? (body[0] as Row | undefined) : undefined;
      return defined({
        killmailId: km?.killmail_id,
        killmailHash: km?.killmail_hash,
      });
    },
  },
  {
    endpoint: 'killmail.getKillmail',
    client: 'killmails',
    method: 'getKillmail',
    args: (ids) => [need(ids, 'killmailId'), need(ids, 'killmailHash')],
  },

  // Factional warfare, industry, insurance, loyalty, incursions, sovereignty, skyhooks
  {
    endpoint: 'faction.getOverall',
    client: 'factions',
    method: 'getLeaderboardsOverall',
    args: none,
  },
  {
    endpoint: 'faction.getCharacters',
    client: 'factions',
    method: 'getLeaderboardsCharacters',
    args: none,
  },
  {
    endpoint: 'faction.getCorporations',
    client: 'factions',
    method: 'getLeaderboardsCorporations',
    args: none,
  },
  {
    endpoint: 'faction.getStats',
    client: 'factions',
    method: 'getStats',
    args: none,
  },
  {
    endpoint: 'faction.getSystems',
    client: 'factions',
    method: 'getSystems',
    args: none,
  },
  {
    endpoint: 'faction.getWars',
    client: 'factions',
    method: 'getWars',
    args: none,
  },
  {
    endpoint: 'industry.getIndustryFacilities',
    client: 'industry',
    method: 'getIndustryFacilities',
    args: none,
  },
  {
    endpoint: 'industry.getIndustrySystems',
    client: 'industry',
    method: 'getIndustrySystems',
    args: none,
  },
  {
    endpoint: 'insurance.getInsurancePrices',
    client: 'insurance',
    method: 'getInsurancePrices',
    args: none,
  },
  {
    endpoint: 'loyalty.getLoyaltyStoreOffers',
    client: 'loyalty',
    method: 'getLoyaltyStoreOffers',
    args: () => [S.npcLoyaltyCorporationId],
  },
  {
    endpoint: 'incursion.getIncursions',
    client: 'incursions',
    method: 'getIncursions',
    args: none,
  },
  {
    endpoint: 'sovereignty.getSovereigntyCampaigns',
    client: 'sovereignty',
    method: 'getSovereigntyCampaigns',
    args: none,
  },
  {
    endpoint: 'sovereignty.getSovereigntySystems',
    client: 'sovereignty',
    method: 'getSovereigntySystems',
    args: none,
  },
  {
    endpoint: 'skyhook.getRaidableSkyhooks',
    client: 'skyhooks',
    method: 'getRaidableSkyhooks',
    args: none,
  },

  // Newer features
  {
    endpoint: 'freelanceJobs.getFreelanceJobs',
    client: 'freelanceJobs',
    method: 'getFreelanceJobs',
    args: none,
    derive: (body) =>
      defined({
        freelanceJobId: first(
          (body as Row)?.freelance_jobs,
          (j) => j.id as string,
        ),
      }),
  },
  {
    endpoint: 'freelanceJobs.getFreelanceJobById',
    client: 'freelanceJobs',
    method: 'getFreelanceJobById',
    args: (ids) => [need(ids, 'freelanceJobId')],
  },
  {
    endpoint: 'militaryCampaign.getMilitaryCampaigns',
    client: 'militaryCampaigns',
    method: 'getMilitaryCampaigns',
    args: none,
    derive: (body) =>
      defined({
        campaignId: first(body, (c) => (c.campaign_id ?? c.id) as string),
      }),
  },
  {
    endpoint: 'militaryCampaign.getMilitaryCampaign',
    client: 'militaryCampaigns',
    method: 'getMilitaryCampaign',
    args: (ids) => [need(ids, 'campaignId')],
  },
  {
    endpoint: 'militaryCampaign.getMilitaryCampaignObjectives',
    client: 'militaryCampaigns',
    method: 'getMilitaryCampaignObjectives',
    args: (ids) => [need(ids, 'campaignId')],
    derive: (body) =>
      defined({
        objectiveId: first(body, (o) => (o.objective_id ?? o.id) as string),
      }),
  },
  {
    endpoint: 'militaryCampaign.getMilitaryCampaignObjective',
    client: 'militaryCampaigns',
    method: 'getMilitaryCampaignObjective',
    args: (ids) => [need(ids, 'campaignId'), need(ids, 'objectiveId')],
  },
  {
    endpoint: 'paragonHub.getPublicListings',
    client: 'paragonHub',
    method: 'getPublicListings',
    args: none,
    derive: (body) => {
      const listings = (body as Row)?.listings ?? (body as Row)?.skinrs ?? body;
      return defined({
        skinrId: first(listings, (l) => (l.skinr_id ?? l.id) as string),
      });
    },
  },
  {
    endpoint: 'cosmetics.getSkinr',
    client: 'cosmetics',
    method: 'getSkinr',
    args: (ids) => [need(ids, 'skinrId')],
  },
  {
    endpoint: 'dogma.getDynamicItemInfo',
    client: 'dogma',
    method: 'getDynamicItemInfo',
    args: (ids) => [need(ids, 'dynamicTypeId'), need(ids, 'dynamicItemId')],
  },
];
