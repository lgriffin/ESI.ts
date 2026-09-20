import type { ParsedSdeFile } from './SdeExtractor';
import type { SdeFileSpec } from './constants';
import { SDE_FILE_REGISTRY } from './constants';
import { transformRecord } from './transforms';
import { SdeError, SdeDatabaseError } from '../errors';

export interface SdeBuildOptions {
  outputPath: string;
  parsedFiles: ParsedSdeFile[];
  sdeVersion: string;
  buildDate: string;
  onProgress?: (tableName: string, inserted: number, total: number) => void;
}

interface DatabaseLike {
  exec(sql: string): void;
  prepare(sql: string): StatementLike;
  pragma(pragma: string): unknown;
  close(): void;
  transaction<T>(fn: () => T): () => T;
}

interface StatementLike {
  run(...params: unknown[]): unknown;
}

type BetterSqlite3Constructor = new (
  path: string,
  options?: { readonly?: boolean },
) => DatabaseLike;

export class SdeDatabaseBuilder {
  private loadBetterSqlite3(): BetterSqlite3Constructor {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('better-sqlite3') as BetterSqlite3Constructor;
    } catch {
      throw new SdeError(
        'better-sqlite3 is required for SDE database building. Install it with: npm install better-sqlite3',
      );
    }
  }

  build(options: SdeBuildOptions): void {
    const Database = this.loadBetterSqlite3();
    let db: DatabaseLike | undefined;

    try {
      db = new Database(options.outputPath);
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = OFF');
      db.pragma('synchronous = OFF');

      this.createSchema(db, options.parsedFiles);
      this.insertData(db, options);
      this.writeMetadata(db, options);

      db.pragma('foreign_keys = ON');
    } catch (err) {
      if (err instanceof SdeError) throw err;
      throw new SdeDatabaseError('Failed to build SDE database', err);
    } finally {
      db?.close();
    }
  }

  private createSchema(db: DatabaseLike, parsedFiles: ParsedSdeFile[]): void {
    const fileMap = new Map(parsedFiles.map((f) => [f.filename, f]));
    const tableSql: string[] = [];

    tableSql.push(`
      CREATE TABLE IF NOT EXISTS sde_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    for (const spec of SDE_FILE_REGISTRY) {
      const parsed = fileMap.get(spec.yamlFile);
      if (!parsed || parsed.records.size === 0) continue;

      const mergedColumns = new Map<string, string>();
      const sampleCount = Math.min(parsed.records.size, 50);
      let i = 0;
      for (const [entityId, raw] of parsed.records) {
        if (i++ >= sampleCount) break;
        const transformed = transformRecord(entityId, raw, spec);
        for (const [col, val] of Object.entries(transformed)) {
          if (!mergedColumns.has(col)) {
            mergedColumns.set(
              col,
              typeof val === 'number'
                ? Number.isInteger(val)
                  ? 'INTEGER'
                  : 'REAL'
                : 'TEXT',
            );
          }
        }
      }

      tableSql.push(this.generateCreateTableFromColumns(spec, mergedColumns));
    }

    db.exec(tableSql.join('\n'));
  }

  private generateCreateTableFromColumns(
    spec: SdeFileSpec,
    columnTypes: Map<string, string>,
  ): string {
    const columns: string[] = [];
    const pkType = spec.idType === 'string' ? 'TEXT' : 'INTEGER';

    for (const [col, sqlType] of columnTypes) {
      const qcol = /^\d/.test(col) ? `"${col}"` : col;
      if (col === spec.idAttribute) {
        columns.push(`  ${qcol} ${pkType} PRIMARY KEY`);
      } else {
        columns.push(`  ${qcol} ${sqlType}`);
      }
    }

    return `CREATE TABLE IF NOT EXISTS ${spec.tableName} (\n${columns.join(',\n')}\n);`;
  }

  private insertData(db: DatabaseLike, options: SdeBuildOptions): void {
    const fileMap = new Map(options.parsedFiles.map((f) => [f.filename, f]));
    const registryMap = new Map(SDE_FILE_REGISTRY.map((s) => [s.yamlFile, s]));

    for (const spec of SDE_FILE_REGISTRY) {
      const parsed = fileMap.get(spec.yamlFile);
      if (!parsed || parsed.records.size === 0) continue;

      this.insertTable(db, spec, parsed, options.onProgress);
    }

    for (const parsed of options.parsedFiles) {
      if (registryMap.has(parsed.filename)) continue;
      // Files not in registry are skipped
    }
  }

  private insertTable(
    db: DatabaseLike,
    spec: SdeFileSpec,
    parsed: ParsedSdeFile,
    onProgress?: (tableName: string, inserted: number, total: number) => void,
  ): void {
    const total = parsed.records.size;
    let inserted = 0;

    const entries = Array.from(parsed.records.entries());
    if (entries.length === 0) return;

    const allColumns = new Set<string>();
    const sampleCount = Math.min(entries.length, 50);
    for (let i = 0; i < sampleCount; i++) {
      const [id, raw] = entries[i]!;
      const row = transformRecord(id, raw, spec);
      for (const col of Object.keys(row)) {
        allColumns.add(col);
      }
    }
    const columns = Array.from(allColumns);
    const quotedColumns = columns.map((c) => (/^\d/.test(c) ? `"${c}"` : c));
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${spec.tableName} (${quotedColumns.join(', ')}) VALUES (${placeholders})`;

    let stmt: StatementLike;
    try {
      stmt = db.prepare(sql);
    } catch (err) {
      throw new SdeDatabaseError(
        `Failed to prepare insert for ${spec.tableName}: ${sql}`,
        err,
      );
    }

    const insertBatch = db.transaction(() => {
      for (const [entityId, raw] of entries) {
        try {
          const row = transformRecord(entityId, raw, spec);
          const values = columns.map((col) => row[col] ?? null);
          stmt.run(...values);
          inserted++;

          if (onProgress && inserted % 1000 === 0) {
            onProgress(spec.tableName, inserted, total);
          }
        } catch (err) {
          throw new SdeDatabaseError(
            `Failed to insert into ${spec.tableName} (id=${String(entityId)})`,
            err,
          );
        }
      }
    });

    insertBatch();

    if (onProgress) {
      onProgress(spec.tableName, inserted, total);
    }
  }

  private writeMetadata(db: DatabaseLike, options: SdeBuildOptions): void {
    const stmt = db.prepare(
      'INSERT OR REPLACE INTO sde_metadata (key, value) VALUES (?, ?)',
    );
    stmt.run('version', options.sdeVersion);
    stmt.run('buildDate', options.buildDate);
    stmt.run('importedAt', new Date().toISOString());
  }
}
