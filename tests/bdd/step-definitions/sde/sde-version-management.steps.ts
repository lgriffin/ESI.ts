import { defineFeature, loadFeature } from 'jest-cucumber';
import { MemorySdeProvider } from '../../../../src/sde/MemorySdeProvider';
import { SdeTestDataFactory } from '../../../../src/sde/SdeTestDataFactory';
import type { IStaticDataProvider } from '../../../../src/sde/IStaticDataProvider';
import type { SdeVersionInfo } from '../../../../src/sde/version';

const feature = loadFeature(
  'tests/bdd/features/sde/0006-sde-version-management.feature',
);

defineFeature(feature, (test) => {
  let provider: IStaticDataProvider;

  afterEach(() => {
    provider?.close();
  });

  test('WHEN querying SDE version, the provider shall return complete metadata', ({
    given,
    when,
    then,
  }) => {
    let version: SdeVersionInfo;

    given('an SDE provider with version metadata', () => {
      provider = new MemorySdeProvider(
        SdeTestDataFactory.createHierarchicalTestData(),
      );
    });

    when('the user queries the SDE version', () => {
      version = provider.getVersion();
    });

    then(
      'the provider shall return version, build date, and import date',
      () => {
        expect(version.version).toBe('2024-01-15.1');
        expect(version.buildDate).toBe('2024-01-15T00:00:00Z');
        expect(version.importedAt).toBe('2024-01-16T12:00:00Z');
        expect(version.checksum).toBe('abc123def456');
      },
    );
  });

  test('WHEN an SDE provider has no custom version, it shall return defaults', ({
    given,
    when,
    then,
  }) => {
    let version: SdeVersionInfo;

    given('an SDE provider with no version configuration', () => {
      provider = new MemorySdeProvider();
    });

    when('the user queries the SDE version', () => {
      version = provider.getVersion();
    });

    then('the provider shall return default version information', () => {
      expect(version.version).toBeDefined();
      expect(version.buildDate).toBeDefined();
      expect(version.importedAt).toBeDefined();
    });
  });
});
