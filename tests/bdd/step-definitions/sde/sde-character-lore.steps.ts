import { defineFeature, loadFeature } from 'jest-cucumber';
import { MemorySdeProvider } from '../../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../../src/sde/SdeTestDataFactory';
import type { IStaticDataProvider } from '../../../../src/sde/IStaticDataProvider';
import type {
  Faction,
  Race,
  Bloodline,
  Ancestry,
  NpcStation,
} from '../../../../src/sde/types';

const feature = loadFeature(
  'tests/bdd/features/sde/sde-character-lore.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('WHEN looking up a faction, the provider shall return faction details', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: Faction | null;

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up faction 500001', () => {
      result = provider.getFaction(500001);
    });

    then(/^the faction name should be "(.*)"$/, (expectedName: string) => {
      expect(result).not.toBeNull();
      expect(result!.name).toBe(expectedName);
    });

    and('the faction should have member races', () => {
      expect(result!.memberRaces).toBeDefined();
      expect(result!.memberRaces.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('WHEN navigating the character hierarchy, the provider shall return connected data', ({
    given,
    when,
    then,
  }) => {
    let race: Race | null;
    let bloodlines: Bloodline[];
    let ancestries: Ancestry[];

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up race 1', () => {
      race = provider.getRace(1);
    });

    then(/^the race name should be "(.*)"$/, (expectedName: string) => {
      expect(race).not.toBeNull();
      expect(race!.name).toBe(expectedName);
    });

    when('I look up bloodlines for race 1', () => {
      bloodlines = provider.getBloodlinesByRace(1);
    });

    then('the result should contain at least 1 bloodline', () => {
      expect(bloodlines.length).toBeGreaterThanOrEqual(1);
    });

    when('I look up ancestries for bloodline 1', () => {
      ancestries = provider.getAncestriesByBloodline(1);
    });

    then('the result should contain at least 1 ancestry', () => {
      expect(ancestries.length).toBeGreaterThanOrEqual(1);
    });
  });

  test('WHEN looking up NPC infrastructure, the provider shall return station details', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: NpcStation | null;

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up NPC station 60003760', () => {
      result = provider.getNpcStation(60003760);
    });

    then('the station should have an owner', () => {
      expect(result).not.toBeNull();
      expect(result!.ownerId).toBeGreaterThan(0);
    });

    and('the station should have reprocessing efficiency', () => {
      expect(result!.reprocessingEfficiency).toBeGreaterThan(0);
    });
  });
});
