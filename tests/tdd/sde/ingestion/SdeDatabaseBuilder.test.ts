import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { SdeDatabaseBuilder } from '../../../../src/sde/ingestion/SdeDatabaseBuilder';
import type { ParsedSdeFile } from '../../../../src/sde/ingestion/SdeExtractor';

let hasBetterSqlite3 = false;
let Database: new (
  path: string,
  opts?: { readonly?: boolean },
) => {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...p: unknown[]): unknown;
    all(...p: unknown[]): unknown[];
  };
  pragma(p: string): unknown;
  close(): void;
};

try {
  Database = require('better-sqlite3');
  hasBetterSqlite3 = true;
} catch {
  // better-sqlite3 not available
}

function createParsedFile(
  filename: string,
  records: Record<number | string, Record<string, unknown>>,
): ParsedSdeFile {
  const map = new Map<string | number, Record<string, unknown>>();
  for (const [key, value] of Object.entries(records)) {
    const numKey = Number(key);
    map.set(Number.isNaN(numKey) ? key : numKey, value);
  }
  return { filename, records: map };
}

(hasBetterSqlite3 ? describe : describe.skip)('SdeDatabaseBuilder', () => {
  let dbPath: string;
  const builder = new SdeDatabaseBuilder();

  beforeEach(() => {
    dbPath = path.join(os.tmpdir(), `sde-builder-test-${Date.now()}.sqlite`);
  });

  afterEach(() => {
    for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
      fs.rmSync(file, { force: true });
    }
  });

  it('should create a database with metadata', () => {
    builder.build({
      outputPath: dbPath,
      parsedFiles: [],
      sdeVersion: '12345',
      buildDate: '2026-01-15',
    });

    const db = new Database(dbPath, { readonly: true });
    const version = db
      .prepare('SELECT value FROM sde_metadata WHERE key = ?')
      .get('version') as { value: string };
    const buildDate = db
      .prepare('SELECT value FROM sde_metadata WHERE key = ?')
      .get('buildDate') as { value: string };
    const importedAt = db
      .prepare('SELECT value FROM sde_metadata WHERE key = ?')
      .get('importedAt') as { value: string };

    expect(version.value).toBe('12345');
    expect(buildDate.value).toBe('2026-01-15');
    expect(importedAt.value).toBeDefined();
    db.close();
  });

  it('stamps importedAt from the injected clock', () => {
    const fixed = {
      now: () => Date.UTC(2026, 0, 2, 3, 4, 5, 678),
      sleep: () => Promise.resolve(),
    };
    new SdeDatabaseBuilder({ clock: fixed }).build({
      outputPath: dbPath,
      parsedFiles: [],
      sdeVersion: '12345',
      buildDate: '2026-01-15',
    });

    const db = new Database(dbPath, { readonly: true });
    const importedAt = db
      .prepare('SELECT value FROM sde_metadata WHERE key = ?')
      .get('importedAt') as { value: string };
    expect(importedAt.value).toBe('2026-01-02T03:04:05.678Z');
    db.close();
  });

  it('should create tables and insert data for known entity types', () => {
    const parsedFiles = [
      createParsedFile('categories.yaml', {
        4: { name: { en: 'Material' }, published: true },
        6: { name: { en: 'Ship' }, published: true },
      }),
    ];

    builder.build({
      outputPath: dbPath,
      parsedFiles,
      sdeVersion: '12345',
      buildDate: '2026-01-15',
    });

    const db = new Database(dbPath, { readonly: true });
    const rows = db.prepare('SELECT * FROM eve_categories').all() as Array<
      Record<string, unknown>
    >;
    expect(rows).toHaveLength(2);

    const material = rows.find((r) => r.categoryId === 4);
    expect(material).toBeDefined();
    expect(material!.name).toBe('Material');
    expect(material!.published).toBe(1);
    db.close();
  });

  it('should handle multiple entity types', () => {
    const parsedFiles = [
      createParsedFile('categories.yaml', {
        4: { name: { en: 'Material' }, published: true },
      }),
      createParsedFile('groups.yaml', {
        18: { name: { en: 'Mineral' }, categoryID: 4, published: true },
      }),
    ];

    builder.build({
      outputPath: dbPath,
      parsedFiles,
      sdeVersion: '12345',
      buildDate: '2026-01-15',
    });

    const db = new Database(dbPath, { readonly: true });
    const categories = db.prepare('SELECT * FROM eve_categories').all();
    const groups = db.prepare('SELECT * FROM eve_groups').all();
    expect(categories).toHaveLength(1);
    expect(groups).toHaveLength(1);
    db.close();
  });

  it('should call progress callback during insertion', () => {
    const progress = jest.fn();
    const parsedFiles = [
      createParsedFile('categories.yaml', {
        4: { name: { en: 'Material' }, published: true },
      }),
    ];

    builder.build({
      outputPath: dbPath,
      parsedFiles,
      sdeVersion: '12345',
      buildDate: '2026-01-15',
      onProgress: progress,
    });

    expect(progress).toHaveBeenCalledWith('eve_categories', 1, 1);
  });

  it('should skip files not in the registry', () => {
    const parsedFiles = [
      createParsedFile('unknown_file.yaml', {
        1: { name: { en: 'Unknown' } },
      }),
    ];

    expect(() => {
      builder.build({
        outputPath: dbPath,
        parsedFiles,
        sdeVersion: '12345',
        buildDate: '2026-01-15',
      });
    }).not.toThrow();
  });

  it('should handle boolean-to-integer conversion', () => {
    const parsedFiles = [
      createParsedFile('categories.yaml', {
        4: { name: { en: 'Material' }, published: false },
      }),
    ];

    builder.build({
      outputPath: dbPath,
      parsedFiles,
      sdeVersion: '12345',
      buildDate: '2026-01-15',
    });

    const db = new Database(dbPath, { readonly: true });
    const row = db
      .prepare('SELECT * FROM eve_categories WHERE categoryId = 4')
      .get() as Record<string, unknown>;
    expect(row.published).toBe(0);
    db.close();
  });

  it('should handle locale extraction in name fields', () => {
    const parsedFiles = [
      createParsedFile('categories.yaml', {
        4: { name: { en: 'Material', de: 'Material' }, published: true },
      }),
    ];

    builder.build({
      outputPath: dbPath,
      parsedFiles,
      sdeVersion: '12345',
      buildDate: '2026-01-15',
    });

    const db = new Database(dbPath, { readonly: true });
    const row = db
      .prepare('SELECT * FROM eve_categories WHERE categoryId = 4')
      .get() as Record<string, unknown>;
    expect(row.name).toBe('Material');
    db.close();
  });

  it('should call onProgress at 1000-record intervals and at end', () => {
    const progress = jest.fn();
    const records: Record<number, Record<string, unknown>> = {};
    for (let i = 1; i <= 1001; i++) {
      records[i] = { name: { en: `Type ${i}` }, published: true };
    }
    const parsedFiles = [createParsedFile('categories.yaml', records)];

    builder.build({
      outputPath: dbPath,
      parsedFiles,
      sdeVersion: '12345',
      buildDate: '2026-01-15',
      onProgress: progress,
    });

    expect(progress.mock.calls).toEqual([
      ['eve_categories', 1000, 1001],
      ['eve_categories', 1001, 1001],
    ]);
  });

  describe('schema', () => {
    type Column = { name: string; type: string; pk: number };

    function build(parsedFiles: ParsedSdeFile[]): void {
      builder.build({
        outputPath: dbPath,
        parsedFiles,
        sdeVersion: '12345',
        buildDate: '2026-01-15',
      });
    }

    function columnsOf(table: string): Column[] {
      const db = new Database(dbPath, { readonly: true });
      const columns = db
        .prepare(`PRAGMA table_info(${table})`)
        .all() as Column[];
      db.close();
      return columns.map(({ name, type, pk }) => ({ name, type, pk }));
    }

    it('types each column from the first value seen: whole numbers INTEGER, fractions REAL, the rest TEXT', () => {
      build([
        createParsedFile('categories.yaml', {
          4: { name: { en: 'Material' }, ratio: 0.5, iconID: 22 },
          6: { name: { en: 'Ship' }, ratio: 'n/a', iconID: 'none' },
        }),
      ]);
      expect(columnsOf('eve_categories')).toEqual([
        { name: 'categoryId', type: 'INTEGER', pk: 1 },
        { name: 'name', type: 'TEXT', pk: 0 },
        { name: 'ratio', type: 'REAL', pk: 0 },
        { name: 'iconId', type: 'INTEGER', pk: 0 },
      ]);
    });

    it('takes the columns from the first 50 records only', () => {
      const records: Record<number, Record<string, unknown>> = {};
      for (let i = 1; i <= 50; i++) records[i] = { name: { en: `C${i}` } };
      records[51] = { name: { en: 'C51' }, late: 1 };
      build([createParsedFile('categories.yaml', records)]);
      expect(columnsOf('eve_categories').map((c) => c.name)).toEqual([
        'categoryId',
        'name',
      ]);
    });

    it('reads a column found in the 50th record', () => {
      const records: Record<number, Record<string, unknown>> = {};
      for (let i = 1; i <= 49; i++) records[i] = { name: { en: `C${i}` } };
      records[50] = { name: { en: 'C50' }, late: 1 };
      build([createParsedFile('categories.yaml', records)]);
      expect(columnsOf('eve_categories').map((c) => c.name)).toEqual([
        'categoryId',
        'name',
        'late',
      ]);
    });

    it('gives a table keyed by string a TEXT primary key', () => {
      build([
        createParsedFile('characterTitles.yaml', {
          abc: { characterTitleID: 'abc', name: { en: 'Pilot' } },
        }),
      ]);
      expect(columnsOf('eve_character_titles')).toEqual([
        { name: 'characterTitleId', type: 'TEXT', pk: 1 },
        { name: 'name', type: 'TEXT', pk: 0 },
      ]);
    });

    it('stores a column whose name starts with a digit or is an SQL keyword', () => {
      build([
        createParsedFile('categories.yaml', {
          4: { name: { en: 'Material' }, '3dModel': 'a.gr2', order: 2 },
        }),
      ]);
      const db = new Database(dbPath, { readonly: true });
      const row = db
        .prepare('SELECT "3dModel", "order" FROM eve_categories')
        .get();
      db.close();
      expect(row).toEqual({ '3dModel': 'a.gr2', order: 2 });
    });

    it('creates no table for a file with no records', () => {
      build([
        createParsedFile('categories.yaml', {}),
        createParsedFile('groups.yaml', { 18: { name: { en: 'Mineral' } } }),
      ]);
      expect(columnsOf('eve_categories')).toEqual([]);
      expect(columnsOf('eve_groups').map((c) => c.name)).toEqual([
        'groupId',
        'name',
      ]);
    });

    it('leaves the database in WAL mode and closed, with no write-ahead file left over', () => {
      build([
        createParsedFile('categories.yaml', { 4: { name: { en: 'M' } } }),
      ]);
      expect(fs.existsSync(`${dbPath}-wal`)).toBe(false);
      const db = new Database(dbPath, { readonly: true });
      expect(db.pragma('journal_mode')).toEqual([{ journal_mode: 'wal' }]);
      db.close();
    });
  });

  describe('failures', () => {
    it('wraps a database that cannot be opened in SdeDatabaseError', () => {
      const missing = path.join(
        os.tmpdir(),
        'sde-no-such-dir',
        'x',
        'db.sqlite',
      );
      expect(() =>
        builder.build({
          outputPath: missing,
          parsedFiles: [],
          sdeVersion: '1',
          buildDate: '2026-01-15',
        }),
      ).toThrow(
        expect.objectContaining({
          name: 'SdeDatabaseError',
          message: 'Failed to build SDE database',
        }),
      );
    });

    it('names the table when the insert cannot be prepared, as when the file already holds other columns', () => {
      const first = [
        createParsedFile('categories.yaml', { 4: { name: { en: 'M' } } }),
      ];
      builder.build({
        outputPath: dbPath,
        parsedFiles: first,
        sdeVersion: '1',
        buildDate: '2026-01-15',
      });
      expect(() =>
        builder.build({
          outputPath: dbPath,
          parsedFiles: [
            createParsedFile('categories.yaml', { 4: { iconID: 22 } }),
          ],
          sdeVersion: '1',
          buildDate: '2026-01-15',
        }),
      ).toThrow(
        expect.objectContaining({
          name: 'SdeDatabaseError',
          message: expect.stringMatching(
            /^Failed to prepare insert for eve_categories: /,
          ),
        }),
      );
    });

    it('names the table and the record when a row cannot be inserted', () => {
      expect(() =>
        builder.build({
          outputPath: dbPath,
          parsedFiles: [
            createParsedFile('categories.yaml', {
              4: { name: { en: 'M' } },
              6: { categoryID: 'six', name: { en: 'S' } },
            }),
          ],
          sdeVersion: '1',
          buildDate: '2026-01-15',
        }),
      ).toThrow(
        expect.objectContaining({
          name: 'SdeDatabaseError',
          message: 'Failed to insert into eve_categories (id=6)',
        }),
      );
    });
  });
});

describe('SdeDatabaseBuilder (no better-sqlite3)', () => {
  it('should throw SdeError when better-sqlite3 is not available', () => {
    const origRequire = jest.requireActual;
    jest.doMock('better-sqlite3', () => {
      throw new Error('Cannot find module');
    });

    jest.resetModules();
    const {
      SdeDatabaseBuilder: FreshBuilder,
    } = require('../../../../src/sde/ingestion/SdeDatabaseBuilder');

    const freshBuilder = new FreshBuilder();
    expect(() =>
      freshBuilder.build({
        outputPath: '/tmp/test.db',
        parsedFiles: [],
        sdeVersion: '1',
        buildDate: '2026-01-01',
      }),
    ).toThrow('better-sqlite3 is required');

    jest.dontMock('better-sqlite3');
    jest.resetModules();
  });
});
