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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    try {
      fs.unlinkSync(dbPath);
    } catch {
      // ignore
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

    const calls = progress.mock.calls as Array<[string, number, number]>;
    const intervalCall = calls.find(([, inserted]) => inserted === 1000);
    expect(intervalCall).toBeDefined();
    expect(intervalCall![0]).toBe('eve_categories');
    const finalCall = calls[calls.length - 1]!;
    expect(finalCall[0]).toBe('eve_categories');
    expect(finalCall[1]).toBe(1001);
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
