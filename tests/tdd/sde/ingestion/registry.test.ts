import { SDE_FILE_REGISTRY } from '../../../../src/sde/ingestion/constants';

describe('SDE_FILE_REGISTRY', () => {
  // The first nightly against CCP's export (build 3542233, 2026-09-28) found
  // no attributeId or effectId inside the dogma records: the export keys
  // them by id only, so the id has to come from the key.
  it.each(['eve_dogma_attributes', 'eve_dogma_effects'])(
    '%s takes its id from the record key',
    (tableName) => {
      const entry = SDE_FILE_REGISTRY.find((e) => e.tableName === tableName);
      expect(entry?.injectId).toBe(true);
    },
  );
});
