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

    it('should return empty strings when metadata fields are non-string/number', () => {
      const zipPath = createTestZip({
        '_sde.yaml': { buildNumber: true, releaseDate: null },
      });
      tempFiles.push(zipPath);

      const metadata = extractor.readMetadata(zipPath);
      expect(metadata.buildNumber).toBe('');
      expect(metadata.releaseDate).toBe('');
    });

    it('should handle string buildNumber and releaseDate', () => {
      const zipPath = createTestZip({
        '_sde.yaml': {
          buildNumber: '2026-01-15.1',
          releaseDate: '2026-01-15',
        },
      });
      tempFiles.push(zipPath);

      const metadata = extractor.readMetadata(zipPath);
      expect(metadata.buildNumber).toBe('2026-01-15.1');
      expect(metadata.releaseDate).toBe('2026-01-15');
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

  describe('extractAll', () => {
    it('should extract all entries to the output directory', () => {
      const zipPath = createTestZip({
        'types.yaml': { 34: { name: { en: 'Tritanium' } } },
        'groups.yaml': { 18: { name: { en: 'Mineral' } } },
      });
      tempFiles.push(zipPath);

      const outputDir = path.join(
        os.tmpdir(),
        `sde-extract-test-${Date.now()}`,
      );

      try {
        extractor.extractAll(zipPath, outputDir);
        expect(fs.existsSync(outputDir)).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'types.yaml'))).toBe(true);
        expect(fs.existsSync(path.join(outputDir, 'groups.yaml'))).toBe(true);
      } finally {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
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

    it('should exclude non-YAML files and directories', () => {
      const zip = new AdmZip();
      zip.addFile('types.yaml', Buffer.from(yaml.dump({ 34: {} })));
      zip.addFile('readme.txt', Buffer.from('hello'));
      zip.addFile('subdir/', Buffer.alloc(0));
      const zipPath = path.join(
        os.tmpdir(),
        `sde-list-filter-${Date.now()}.zip`,
      );
      zip.writeZip(zipPath);
      tempFiles.push(zipPath);

      const files = extractor.listFiles(zipPath);
      expect(files).toContain('types.yaml');
      expect(files).not.toContain('readme.txt');
      expect(files).not.toContain('subdir/');
    });
  });

  describe('findEntry with directory entries', () => {
    it('should skip directory entries when searching', () => {
      const zip = new AdmZip();
      zip.addFile('categories/', Buffer.alloc(0));
      zip.addFile(
        'categories.yaml',
        Buffer.from(yaml.dump({ 4: { name: { en: 'Material' } } })),
      );
      const zipPath = path.join(os.tmpdir(), `sde-dir-entry-${Date.now()}.zip`);
      zip.writeZip(zipPath);
      tempFiles.push(zipPath);

      const result = extractor.parseFile(zipPath, 'categories.yaml');
      expect(result.records.size).toBe(1);
    });
  });

  describe('findEntry fallback matching', () => {
    it('should find entry by exact full path', () => {
      const zip = new AdmZip();
      zip.addFile(
        'sde/categories.yaml',
        Buffer.from(yaml.dump({ 4: { name: { en: 'Material' } } })),
      );
      const zipPath = path.join(os.tmpdir(), `sde-fullpath-${Date.now()}.zip`);
      zip.writeZip(zipPath);
      tempFiles.push(zipPath);

      const result = extractor.parseFile(zipPath, 'sde/categories.yaml');
      expect(result.records.size).toBe(1);
      expect(result.records.get(4)).toBeDefined();
    });

    it('should find entry by basename when stored under sde/ prefix', () => {
      const zip = new AdmZip();
      zip.addFile(
        'sde/types.yaml',
        Buffer.from(yaml.dump({ 34: { name: { en: 'Tritanium' } } })),
      );
      const zipPath = path.join(os.tmpdir(), `sde-basename-${Date.now()}.zip`);
      zip.writeZip(zipPath);
      tempFiles.push(zipPath);

      const result = extractor.parseFile(zipPath, 'types.yaml');
      expect(result.records.size).toBe(1);
    });

    it('should read metadata from sde/ prefixed entry', () => {
      const zip = new AdmZip();
      zip.addFile(
        'sde/_sde.yaml',
        Buffer.from(yaml.dump({ buildNumber: 99, releaseDate: '2026-06-01' })),
      );
      const zipPath = path.join(
        os.tmpdir(),
        `sde-meta-prefix-${Date.now()}.zip`,
      );
      zip.writeZip(zipPath);
      tempFiles.push(zipPath);

      const metadata = extractor.readMetadata(zipPath);
      expect(metadata.buildNumber).toBe('99');
    });
  });
});
