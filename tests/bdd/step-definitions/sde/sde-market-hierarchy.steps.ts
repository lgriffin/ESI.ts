import { defineFeature, loadFeature } from 'jest-cucumber';
import { MemorySdeProvider } from '../../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../../src/sde/SdeTestDataFactory';
import type { IStaticDataProvider } from '../../../../src/sde/IStaticDataProvider';
import type { MarketGroup } from '../../../../src/sde/types';

const feature = loadFeature(
  'tests/bdd/features/sde/0003-sde-market-hierarchy.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('WHEN looking up root market groups, the provider shall return top-level groups', ({
    given,
    when,
    then,
  }) => {
    let results: MarketGroup[];

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up root market groups', () => {
      results = provider.getRootMarketGroups();
    });

    then('each market group should have null parent group ID', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
      for (const group of results) {
        expect(group.parentGroupId).toBeNull();
      }
    });
  });

  test('WHEN navigating market group children, the provider shall return child groups', ({
    given,
    when,
    then,
    and,
  }) => {
    let results: MarketGroup[];

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up market groups with parent 1031', () => {
      results = provider.getMarketGroupsByParent(1031);
    });

    then('the result should contain at least 1 market group', () => {
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    and(/^the first group name should be "(.*)"$/, (expectedName: string) => {
      expect(results[0]!.name).toBe(expectedName);
    });
  });
});
