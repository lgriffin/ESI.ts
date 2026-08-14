import { defineFeature, loadFeature } from 'jest-cucumber';
import { MemorySdeProvider } from '../../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../../src/sde/SdeTestDataFactory';
import type { IStaticDataProvider } from '../../../../src/sde/IStaticDataProvider';
import type {
  EveType,
  EveGroup,
  EveCategory,
  SolarSystem,
  Stargate,
} from '../../../../src/sde/types';

const feature = loadFeature(
  'tests/bdd/features/sde/static-data-lookup.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('WHEN looking up a known item type, the provider shall return the data', ({
    given,
    when,
    then,
  }) => {
    let result: EveType | null;

    given('an SDE provider with Tritanium loaded', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('the user looks up type ID 34', () => {
      result = provider.getType(34);
    });

    then('the provider shall return Tritanium with correct attributes', () => {
      expect(result).not.toBeNull();
      expect(result!.typeId).toBe(34);
      expect(result!.name).toBe('Tritanium');
      expect(result!.groupId).toBe(18);
      expect(result!.published).toBe(true);
    });
  });

  test('IF looking up an unknown type ID, THEN the provider shall return null', ({
    given,
    when,
    then,
  }) => {
    let result: EveType | null;

    given('an SDE provider with test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('the user looks up a non-existent type ID', () => {
      result = provider.getType(999999);
    });

    then('the provider shall return null', () => {
      expect(result).toBeNull();
    });
  });

  test('WHEN searching for types by name, the provider shall return matching results', ({
    given,
    when,
    then,
  }) => {
    let results: EveType[];

    given('an SDE provider with multiple types loaded', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('the user searches for types matching "Trit"', () => {
      results = provider.searchTypesByName('Trit');
    });

    then('the provider shall return types whose names contain "Trit"', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (const type of results) {
        expect(type.name.toLowerCase()).toContain('trit');
      }
    });
  });

  test('WHEN navigating the type hierarchy, the provider shall return connected data', ({
    given,
    when,
    then,
  }) => {
    let type: EveType | null;
    let group: EveGroup | null;
    let category: EveCategory | null;

    given('an SDE provider with a complete type hierarchy', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when(
      'the user looks up a type and navigates to its group and category',
      () => {
        type = provider.getType(34);
        group = type ? provider.getGroup(type.groupId) : null;
        category = group ? provider.getCategory(group.categoryId) : null;
      },
    );

    then('the provider shall return the correct group and category', () => {
      expect(type).not.toBeNull();
      expect(group).not.toBeNull();
      expect(group!.name).toBe('Mineral');
      expect(category).not.toBeNull();
      expect(category!.name).toBe('Material');
    });
  });

  test('WHEN navigating the geography hierarchy, the provider shall return connected data', ({
    given,
    when,
    then,
  }) => {
    let constellations: ReturnType<
      IStaticDataProvider['getConstellationsByRegion']
    >;
    let systems: SolarSystem[];

    given('an SDE provider with The Forge region data loaded', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when(
      'the user looks up the region and navigates through constellations and systems',
      () => {
        const region = provider.getRegion(10000002);
        constellations = region
          ? provider.getConstellationsByRegion(region.regionId)
          : [];
        systems =
          constellations.length > 0
            ? provider.getSolarSystemsByConstellation(
                constellations[0]!.constellationId,
              )
            : [];
      },
    );

    then(
      'the provider shall return Kimotoro constellation and Jita solar system',
      () => {
        expect(constellations.length).toBeGreaterThanOrEqual(1);
        expect(constellations[0]!.name).toBe('Kimotoro');
        expect(systems.length).toBeGreaterThanOrEqual(1);
        const jita = systems.find((s) => s.name === 'Jita');
        expect(jita).toBeDefined();
      },
    );
  });

  test('WHEN looking up stargates for a system, the provider shall return connections', ({
    given,
    when,
    then,
  }) => {
    let stargates: Stargate[];

    given('an SDE provider with stargate data for Jita', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('the user looks up stargates for Jita', () => {
      stargates = provider.getStargatesBySystem(30000142);
    });

    then(
      'the provider shall return at least one stargate with a destination',
      () => {
        expect(stargates.length).toBeGreaterThanOrEqual(1);
        expect(stargates[0]!.destinationSystemId).toBeDefined();
        expect(stargates[0]!.destinationStargateId).toBeDefined();
      },
    );
  });
});
