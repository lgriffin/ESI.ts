import * as ingestion from '../../../../src/sde/ingestion/index';

describe('src/sde/ingestion/index barrel export', () => {
  it('should export SdeDownloader', () => {
    expect(ingestion.SdeDownloader).toBeDefined();
  });

  it('should export SdeExtractor', () => {
    expect(ingestion.SdeExtractor).toBeDefined();
  });

  it('should export SdeDatabaseBuilder', () => {
    expect(ingestion.SdeDatabaseBuilder).toBeDefined();
  });

  it('should export transform functions', () => {
    expect(ingestion.extractLocale).toBeDefined();
    expect(ingestion.normalizeSdeFieldName).toBeDefined();
    expect(ingestion.toSqliteValue).toBeDefined();
    expect(ingestion.transformRecord).toBeDefined();
  });

  it('should export constants', () => {
    expect(ingestion.SDE_DOWNLOAD_URL).toBeDefined();
    expect(ingestion.SDE_LATEST_BUILD_URL).toBeDefined();
    expect(ingestion.SDE_BUILD_NUMBER_HEADER).toBeDefined();
    expect(ingestion.SDE_METADATA_FILENAME).toBeDefined();
    expect(ingestion.SDE_FILE_REGISTRY).toBeDefined();
    expect(Array.isArray(ingestion.SDE_FILE_REGISTRY)).toBe(true);
  });
});
