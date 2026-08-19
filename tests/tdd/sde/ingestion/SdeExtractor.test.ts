import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';
import { SdeExtractor } from '../../../../src/sde/ingestion/SdeExtractor';
import { SdeError } from '../../../../src/sde/errors';

function createTestZip(files: Record<string, unknown>): string {
  const zip = new AdmZip();
  for (const [name, content] of Object.entries(files)) {
    const yamlContent =
      typeof content === 'string' ? content : yaml.dump(content);
    zip.addFile(name, Buffer.from(yamlContent, 'utf-8'));
  }
  const zipPath = path.join(os.tmpdir(), `sde-test-${Date.now()}.zip`);
  zip.writeZip(zipPath);
  return zipPath;
}

describe('SdeExtractor', () => {
  let extractor: SdeExtractor;
  const tempFiles: string[] = [];

  beforeEach(() => {
    extractor = new SdeExtractor();
  });

  afterAll(() => {
    for (const f of tempFiles) {
      try {
        fs.unlinkSync(f);
      } catch {
        // ignore cleanup errors
      }
    }
  });

  describe('readMetadata', () => {
    it('should read build number and release date from _sde.yaml', () => {
      const zipPath = createTestZip({
        '_sde.yaml': { buildNumber: 12345, releaseDate: '2026-01-15' },
      });
      tempFiles.push(zipPath);

      const metadata = extractor.readMetadata(zipPath);
      expect(metadata.buildNumber).toBe('12345');
      expect(metadata.releaseDate).toBe('2026-01-15');
    });

    it('should throw SdeError when metadata file is missing', () => {
      const zipPath = createTestZip({ 'types.yaml': {} });
      tempFiles.push(zipPath);

      expect(() => extractor.readMetadata(zipPath)).toThrow(SdeError);
    });
  });

  describe('parseFile', () => {
    it('should parse a YAML file into a Map of records', () => {
      const zipPath = createTestZip({
        'categories.yaml': {
          4: { name: { en: 'Material' }, published: true },
          6: { name: { en: 'Ship' }, published: true },
        },
      });
      tempFiles.push(zipPath);

      const result = extractor.parseFile(zipPath, 'categories.yaml');
      expect(result.filename).toBe('categories.yaml');
      expect(result.records.size).toBe(2);
      expect(result.records.get(4)).toBeDefined();
      expect(result.records.get(6)).toBeDefined();
    });

    it('should coerce numeric keys', () => {
      const zipPath = createTestZip({
        'types.yaml': {
          34: { name: { en: 'Tritanium' } },
        },
      });
      tempFiles.push(zipPath);

      const result = extractor.parseFile(zipPath, 'types.yaml');
      expect(result.records.has(34)).toBe(true);
    });

    it('should preserve string keys for string-keyed entities', () => {
      const zipPath = createTestZip({
        'characterTitles.yaml': {
          title_1: { name: { en: 'Captain' } },
        },
      });
      tempFiles.push(zipPath);

      const result = extractor.parseFile(zipPath, 'characterTitles.yaml');
      expect(result.records.has('title_1')).toBe(true);
    });

    it('should throw SdeError for missing file', () => {
      const zipPath = createTestZip({ 'types.yaml': {} });
      tempFiles.push(zipPath);

      expect(() => extractor.parseFile(zipPath, 'nonexistent.yaml')).toThrow(
        SdeError,
      );
    });
  });

  describe('parseFiles', () => {
    it('should parse multiple files from one zip', () => {
      const zipPath = createTestZip({
        'categories.yaml': { 4: { name: { en: 'Material' } } },
        'groups.yaml': { 18: { name: { en: 'Mineral' } } },
      });
      tempFiles.push(zipPath);

      const results = extractor.parseFiles(zipPath, [
        'categories.yaml',
        'groups.yaml',
      ]);
      expect(results).toHaveLength(2);
    });

    it('should skip missing files without throwing', () => {
      const zipPath = createTestZip({
        'categories.yaml': { 4: { name: { en: 'Material' } } },
      });
      tempFiles.push(zipPath);

      const results = extractor.parseFiles(zipPath, [
        'categories.yaml',
        'nonexistent.yaml',
      ]);
      expect(results).toHaveLength(1);
    });
  });

  describe('listFiles', () => {
    it('should list all YAML files in the zip', () => {
      const zipPath = createTestZip({
        'types.yaml': {},
        'groups.yaml': {},
        '_sde.yaml': { buildNumber: 1 },
      });
      tempFiles.push(zipPath);

      const files = extractor.listFiles(zipPath);
      expect(files).toContain('types.yaml');
      expect(files).toContain('groups.yaml');
      expect(files).toContain('_sde.yaml');
    });
  });
});
