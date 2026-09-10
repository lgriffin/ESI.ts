import { defineFeature, loadFeature } from 'jest-cucumber';
import { MemorySdeProvider } from '../../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../../src/sde/SdeTestDataFactory';
import type { IStaticDataProvider } from '../../../../src/sde/IStaticDataProvider';
import type {
  DogmaAttribute,
  Blueprint,
  PlanetSchematic,
} from '../../../../src/sde/types';

const feature = loadFeature(
  'tests/bdd/features/sde/0004-sde-dogma-industry.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('Attribute 9 is named hp and is flagged high-is-good', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: DogmaAttribute | null;

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up dogma attribute 9', () => {
      result = provider.getDogmaAttribute(9);
    });

    then(/^the attribute name should be "(.*)"$/, (expectedName: string) => {
      expect(result).not.toBeNull();
      expect(result!.name).toBe(expectedName);
    });

    and('the attribute should be marked as high is good', () => {
      expect(result!.highIsGood).toBe(true);
    });
  });

  test('Blueprint 787 manufactures from a material list in 6000 seconds', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: Blueprint | null;

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up blueprint 787', () => {
      result = provider.getBlueprint(787);
    });

    then('the blueprint should have manufacturing activity', () => {
      expect(result).not.toBeNull();
      expect(result!.activities.manufacturing).toBeDefined();
    });

    and('the manufacturing should have materials', () => {
      const mfg = result!.activities.manufacturing;
      expect(mfg).toBeDefined();
      expect(mfg!.materials!.length).toBeGreaterThanOrEqual(1);
    });

    and('the manufacturing time should be 6000', () => {
      expect(result!.activities.manufacturing!.time).toBe(6000);
    });
  });

  test('Schematic 65 is Bacteria on a 1800 second cycle', ({
    given,
    when,
    then,
    and,
  }) => {
    let result: PlanetSchematic | null;

    given('a static data provider with hierarchical test data', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('I look up planet schematic 65', () => {
      result = provider.getPlanetSchematic(65);
    });

    then(/^the schematic name should be "(.*)"$/, (expectedName: string) => {
      expect(result).not.toBeNull();
      expect(result!.name).toBe(expectedName);
    });

    and('the schematic cycle time should be 1800', () => {
      expect(result!.cycleTime).toBe(1800);
    });
  });
});
