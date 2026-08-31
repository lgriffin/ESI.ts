import { defineFeature, loadFeature } from 'jest-cucumber';
import { MemorySdeProvider } from '../../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../../src/sde/SdeTestDataFactory';
import type { IStaticDataProvider } from '../../../../src/sde/IStaticDataProvider';
import type {
  Star,
  Planet,
  Moon,
  AsteroidBelt,
} from '../../../../src/sde/types';

const feature = loadFeature(
  'tests/bdd/features/sde/0002-sde-universe-hierarchy.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('WHEN looking up a star by system, the provider shall return the star', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: Star | null;

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up the star for system 30000142', () => {
      result = provider.getStarBySystem(30000142);
    });

    then('the star should have a type ID', () => {
      expect(result).not.toBeNull();
      expect(result!.typeId).toBeGreaterThan(0);
    });

    and(
      /^the star should have spectral class "(.*)"$/,
      (expectedClass: string) => {
        expect(result!.statistics.spectralClass).toBe(expectedClass);
      },
    );
  });

  test('WHEN looking up planets for a system, the provider shall return planets', ({
    given,
    when,
    then,
    and,
  }) => {
    let results: Planet[];

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up planets for system 30000142', () => {
      results = provider.getPlanetsBySystem(30000142);
    });

    then('the result should contain at least 1 planet', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    and('each planet should belong to system 30000142', () => {
      for (const planet of results) {
        expect(planet.solarSystemId).toBe(30000142);
      }
    });
  });

  test('WHEN looking up moons for a system, the provider shall return moons', ({
    given,
    when,
    then,
    and,
  }) => {
    let results: Moon[];

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up moons for system 30000142', () => {
      results = provider.getMoonsBySystem(30000142);
    });

    then('the result should contain at least 1 moon', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    and('each moon should belong to system 30000142', () => {
      for (const moon of results) {
        expect(moon.solarSystemId).toBe(30000142);
      }
    });
  });

  test('WHEN looking up asteroid belts for a system, the provider shall return belts', ({
    given,
    when,
    then,
  }) => {
    let results: AsteroidBelt[];

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up asteroid belts for system 30000142', () => {
      results = provider.getAsteroidBeltsBySystem(30000142);
    });

    then('the result should contain at least 1 asteroid belt', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });
});
