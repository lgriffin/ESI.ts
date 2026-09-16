/**
 * Every TestDataFactory builder's default output passes the Zod schema the
 * client validates that response with. Consumers queue these payloads in
 * their own tests (`@lgriffin/esi.ts/testing`), so a builder a schema rejects
 * makes a consumer's test fail with EsiValidationError for no fault of their
 * code.
 */
import { z } from 'zod';
import { TestDataFactory } from '../../../src/testing/TestDataFactory';
import * as schemas from '../../../src/schemas';

type Builder = Exclude<
  {
    [K in keyof typeof TestDataFactory]: (typeof TestDataFactory)[K] extends (
      ...args: never[]
    ) => unknown
      ? K
      : never;
  }[keyof typeof TestDataFactory],
  'prototype'
>;

/** Builders that assemble fixtures or errors rather than one ESI payload. */
const NOT_PAYLOAD_BUILDERS = new Set<string>([
  'createError',
  'createTestScenarios',
  'createPerformanceTestData',
  'createRealisticTestData',
]);

/** The schema each builder's payload is validated against. */
const builderSchemas: Record<string, z.ZodType> = {
  createAllianceInfo: schemas.AllianceInfoSchema,
  createAllianceContact: schemas.AllianceContactSchema,
  createAllianceContactLabel: schemas.AllianceContactLabelSchema,
  createCharacterInfo: schemas.CharacterInfoSchema,
  createCharacterPortrait: schemas.CharacterPortraitSchema,
  createCharacterAttributes: schemas.CharacterAttributesSchema,
  createCharacterSkill: schemas.CharacterSkillSchema,
  createCharacterRoles: schemas.CharacterRoleSchema,
  createCorporationHistoryEntry: schemas.CorporationHistorySchema,
  createCharacterMedal: schemas.MedalSchema,
  createCharacterNotification: schemas.NotificationSchema,
  createMarketPrice: schemas.MarketPriceSchema,
  createMarketHistory: schemas.MarketHistorySchema,
  createCharacterMarketOrder: schemas.CharacterMarketOrderSchema,
  createCharacterOrderHistory: schemas.CharacterMarketOrderHistorySchema,
  createSolarSystem: schemas.SolarSystemInfoSchema,
  createStation: schemas.StationInfoSchema,
  createStructure: schemas.StructureInfoSchema,
  createItemType: schemas.TypeInfoSchema,
  createItemGroup: schemas.ItemGroupSchema,
  createStar: schemas.StarInfoSchema,
  createPlanet: schemas.PlanetInfoSchema,
  createSearchResults: schemas.SearchResultSchema,
  createEntityName: schemas.NameAndCategorySchema,
  createCorporationMemberRoles: schemas.CorporationMemberRoleSchema,
  createCorporationAsset: schemas.CharacterAssetSchema,
  createCorporationStructure: schemas.CorporationStructureSchema,
  createCorporationWallet: schemas.CorporationWalletDivisionSchema,
  createWalletJournalEntry: schemas.WalletJournalSchema,
  createFleetInfo: schemas.FleetInfoSchema,
  createFleetMember: schemas.FleetMemberSchema,
  createFleetWing: schemas.FleetWingSchema,
  createIndustryJob: schemas.IndustryJobSchema,
  createBlueprint: schemas.BlueprintSchema,
  createCharacterAsset: schemas.CharacterAssetSchema,
  createCharacterLocation: schemas.CharacterLocationSchema,
  createCharacterSkills: schemas.CharacterSkillsResponseSchema,
  createCorporationInfo: schemas.CorporationInfoSchema,
  createMarketOrder: schemas.MarketOrderSchema,
  createWalletTransaction: schemas.WalletTransactionSchema,
  createContract: schemas.ContractSchema,
  createPublicContract: schemas.PublicContractSchema,
  createSovereigntySystem: schemas.SovereigntySystemSchema,
  createSovereigntyHub: schemas.SovereigntyHubSchema,
  createOrbitalSkyhook: schemas.OrbitalSkyhookSchema,
  createRaidableSkyhook: schemas.RaidableSkyhookSchema,
  createMercenaryDen: schemas.MercenaryDenSchema,
  createMercenaryTacticalOperation: schemas.MercenaryTacticalOperationSchema,
  createAccessListEntry: schemas.AccessListEntrySchema,
};

const payloadBuilders = Object.getOwnPropertyNames(TestDataFactory)
  .filter(
    (name) =>
      name.startsWith('create') &&
      typeof (TestDataFactory as unknown as Record<string, unknown>)[name] ===
        'function',
  )
  .filter((name) => !NOT_PAYLOAD_BUILDERS.has(name))
  .sort();

describe('TestDataFactory payloads match the response schemas', () => {
  it('maps every payload builder to a schema', () => {
    expect(Object.keys(builderSchemas).sort()).toEqual(payloadBuilders);
  });

  it.each(payloadBuilders)('%s() passes its schema', (name) => {
    const build = TestDataFactory[name as Builder] as () => unknown;
    const schema = builderSchemas[name];
    expect(schema).toBeDefined();

    const result = schema!.safeParse(build.call(TestDataFactory));

    expect(result.success ? [] : result.error.issues).toEqual([]);
  });
});

describe('TestDataFactory payloads carry no fields ESI never sends', () => {
  it.each([
    // GET /characters/{character_id}: the ID is the path, not the body.
    ['createCharacterInfo', ['character_id']],
    // GET /fleets/{fleet_id}: FleetsFleetIdGet has neither field.
    ['createFleetInfo', ['fleet_id', 'fleet_boss_id']],
    // GET /fleets/{fleet_id}/wings: wings and squads are keyed by `id`.
    ['createFleetWing', ['wing_id']],
  ] as const)('%s() omits %j', (name, fields) => {
    const payload = (TestDataFactory[name] as () => Record<string, unknown>)();
    for (const field of fields) {
      expect(payload).not.toHaveProperty(field);
    }
  });

  it('createFleetWing() keys its squads by id', () => {
    const wing = TestDataFactory.createFleetWing();
    for (const squad of wing.squads) {
      expect(Object.keys(squad).sort()).toEqual(['id', 'name']);
    }
  });
});
