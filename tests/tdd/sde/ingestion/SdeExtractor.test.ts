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

describe('ARCH-12: SdeExtractor', () => {
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

    it('should read build number and release date nested under an sde: block', () => {
      const zipPath = createTestZip({
        '_sde.yaml': { sde: { buildNumber: 12345, releaseDate: '2026-01-15' } },
      });
      tempFiles.push(zipPath);

      const metadata = extractor.readMetadata(zipPath);
      expect(metadata.buildNumber).toBe('12345');
      expect(metadata.releaseDate).toBe('2026-01-15');
    });

    it('should prefer the nested sde: block when both layouts are present', () => {
      const zipPath = createTestZip({
        '_sde.yaml': {
          buildNumber: 1,
          releaseDate: '2000-01-01',
          sde: { buildNumber: 2, releaseDate: '2026-01-15' },
        },
      });
      tempFiles.push(zipPath);

      const metadata = extractor.readMetadata(zipPath);
      expect(metadata.buildNumber).toBe('2');
      expect(metadata.releaseDate).toBe('2026-01-15');
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

    it('overwrites a file already in the output directory', () => {
      const zipPath = createTestZip({ 'types.yaml': 'fresh: 1\n' });
      tempFiles.push(zipPath);
      const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sde-extract-'));
      fs.writeFileSync(path.join(outputDir, 'types.yaml'), 'stale: 1\n');

      try {
        extractor.extractAll(zipPath, outputDir);
        expect(
          fs.readFileSync(path.join(outputDir, 'types.yaml'), 'utf-8'),
        ).toBe('fresh: 1\n');
      } finally {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    });
  });

  describe('extractAll with entry names from a hostile archive', () => {
    /**
     * adm-zip sanitises a name it is asked to add, so each hostile name is
     * added as a same-length placeholder and patched into the bytes.
     */
    function hostileZip(hostile: string): string {
      const placeholder = 'q'.repeat(Buffer.byteLength(hostile));
      const zip = new AdmZip();
      zip.addFile(placeholder, Buffer.from('escaped: true\n'));
      zip.addFile('types.yaml', Buffer.from('benign: true\n'));
      const bytes = zip.toBuffer();
      const from = Buffer.from(placeholder);
      for (let at = bytes.indexOf(from); at !== -1; at = bytes.indexOf(from)) {
        Buffer.from(hostile).copy(bytes, at);
      }
      const zipPath = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), 'sde-hostile-')),
        'h.zip',
      );
      fs.writeFileSync(zipPath, bytes);
      tempFiles.push(zipPath);
      return zipPath;
    }

    it.each([
      ['a parent-directory climb', '../escaped.yaml'],
      ['a climb after a folder', 'sde/../../escaped.yaml'],
      ['a backslash climb', '..\\escaped.yaml'],
      ['an absolute path', '/tmp/escaped.yaml'],
      ['a drive letter', 'C:/escaped.yaml'],
    ])('refuses %s and writes nothing', (_label, name) => {
      const zipPath = hostileZip(name);
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sde-out-'));
      const outputDir = path.join(root, 'out');
      try {
        let message = '';
        try {
          extractor.extractAll(zipPath, outputDir);
        } catch (error) {
          expect(error).toBeInstanceOf(SdeError);
          message = (error as SdeError).message;
        }
        expect(message).toContain('1 entry would land outside');
        expect(message).toContain(JSON.stringify(name));
        expect(fs.readdirSync(root)).toEqual([]);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });

    it('extracts a name that climbs and returns inside the directory', () => {
      const zipPath = hostileZip('sde/../inside.yaml');
      const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sde-out-'));
      try {
        extractor.extractAll(zipPath, outputDir);
        expect(fs.readdirSync(outputDir).sort()).toEqual([
          'inside.yaml',
          'types.yaml',
        ]);
      } finally {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    });

    it('counts every escaping entry in the refusal', () => {
      const zip = new AdmZip();
      zip.addFile('qqqqqqq.yaml', Buffer.from('a: 1\n'));
      zip.addFile('wwwwwww.yaml', Buffer.from('b: 2\n'));
      const bytes = zip.toBuffer();
      for (const from of ['qqqqqqq.yaml', 'wwwwwww.yaml']) {
        const needle = Buffer.from(from);
        for (
          let at = bytes.indexOf(needle);
          at !== -1;
          at = bytes.indexOf(needle)
        ) {
          Buffer.from(`../${from.slice(3)}`).copy(bytes, at);
        }
      }
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sde-hostile-'));
      const zipPath = path.join(dir, 'two.zip');
      fs.writeFileSync(zipPath, bytes);
      try {
        expect(() =>
          extractor.extractAll(zipPath, path.join(dir, 'out')),
        ).toThrow(/2 entries would land outside/);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('entry lookup by file name', () => {
    it('finds the file at any depth and picks it among others, whichever separator the archive used', () => {
      const zipPath = createTestZip({
        'sde/fsd/groups.yaml': { 18: { name: 'Mineral' } },
        'sde\\fsd\\types.yaml': { 34: { name: 'Tritanium' } },
        'categories.yaml': { 4: { name: 'Material' } },
      });
      tempFiles.push(zipPath);

      const names = (file: string) =>
        [...extractor.parseFile(zipPath, file).records.values()].map(
          (r) => r.name,
        );
      expect(names('types.yaml')).toEqual(['Tritanium']);
      expect(names('groups.yaml')).toEqual(['Mineral']);
      expect(names('categories.yaml')).toEqual(['Material']);
    });

    it('matches on the base name of a requested path', () => {
      const zipPath = createTestZip({
        'groups.yaml': { 18: { name: 'Mineral' } },
      });
      tempFiles.push(zipPath);

      expect(
        extractor
          .parseFiles(zipPath, ['sde/groups.yaml'])
          .map((f) => f.filename),
      ).toEqual(['sde/groups.yaml']);
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
