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
  'tests/bdd/features/sde/sde-dogma-industry.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('WHEN looking up a dogma attribute, the provider shall return attribute details', ({
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

  test('WHEN looking up a blueprint, the provider shall return manufacturing data', ({
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

    then('the blueprint should have manufacturing data', () => {
      expect(result).not.toBeNull();
      expect(result!.manufacturing).not.toBeNull();
    });

    and('the manufacturing should have materials', () => {
      expect(result!.manufacturing!.materials.length).toBeGreaterThanOrEqual(1);
    });

    and('the manufacturing time should be 6000', () => {
      expect(result!.manufacturing!.time).toBe(6000);
    });
  });

  test('WHEN looking up a planet schematic, the provider shall return schematic details', ({
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

    and('the schematic should have input and output types', () => {
      const inputs = result!.types.filter((t) => t.isInput);
      const outputs = result!.types.filter((t) => !t.isInput);
      expect(inputs.length).toBeGreaterThanOrEqual(1);
      expect(outputs.length).toBeGreaterThanOrEqual(1);
    });
  });
});
