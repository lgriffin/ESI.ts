/**
 * What the loading, optional-peer, entry-point and ingestion features
 * (tests/bdd/features/sde/0020 to 0023) work on: SDE files on disk, ZIP
 * archives of them, the network the downloader reads through the transport
 * seam, and the peers a scenario declares missing. Nothing here touches the
 * network; every file lives under the OS temp directory and is removed by the
 * cleanups the World runs after the scenario.
 */
import AdmZip from 'adm-zip';
import * as yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Clock } from '../../../src/core/ports/Clock';
import * as sdeEntry from '../../../src/sde/index';
import * as memoryEntry from '../../../src/sde/memory';
import { SdeDataProvider } from '../../../src/sde/providers/yaml/SdeDataProvider';
import { SdeError } from '../../../src/sde/errors';
import { SdeTestDataFactory } from '../../../src/sde/SdeTestDataFactory';
import { SdeDatabaseBuilder } from '../../../src/sde/ingestion/SdeDatabaseBuilder';
import { SdeDownloader } from '../../../src/sde/ingestion/SdeDownloader';
import { SdeExtractor } from '../../../src/sde/ingestion/SdeExtractor';
import type { ParsedSdeFile } from '../../../src/sde/ingestion/SdeExtractor';
import { SDE_FILE_REGISTRY } from '../../../src/sde/ingestion/constants';
import {
  transformRecord,
  transformRecordNative,
} from '../../../src/sde/ingestion/transforms';
import { queueResponse } from './transport';
import type { World } from './world';

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** The instant every loaded provider and built database is stamped with. */
export const IMPORTED_AT = '2026-09-28T12:00:00.000Z';

export const fixedClock: Clock = {
  now: () => Date.parse(IMPORTED_AT),
  sleep: () => Promise.resolve(),
};

// ---------------------------------------------------------------------------
// Raw SDE files, as CCP ships them
// ---------------------------------------------------------------------------

export const BUILD = { buildNumber: '2026-09-15.1', releaseDate: '2026-09-15' };

/**
 * A minimal export: the build under a nested `sde:` block, two types whose
 * names are locale maps and whose foreign keys carry CCP's `ID` suffix, and
 * their group. Loading must turn these into the records the provider serves.
 */
export const RAW_SDE_FILES: Record<string, unknown> = {
  '_sde.yaml': { sde: BUILD },
  'types.yaml': {
    34: {
      name: { en: 'Tritanium', de: 'Tritanium', fr: 'Tritanium' },
      groupID: 18,
      mass: 0,
      portionSize: 1,
      published: true,
    },
    35: {
      name: { en: 'Pyerite', de: 'Pyerit' },
      groupID: 18,
      mass: 0,
      portionSize: 1,
      published: true,
    },
  },
  'groups.yaml': {
    18: {
      name: { en: 'Mineral' },
      categoryID: 4,
      published: true,
      anchorable: false,
      anchored: false,
      fittableNonSingleton: false,
      useBasePrice: true,
    },
  },
};

/**
 * A file CCP might ship before the registry names it, whose text js-yaml
 * refuses (an unclosed flow sequence), so reading it would fail the load.
 */
export const UNREGISTERED_INVALID_YAML: Record<string, string> = {
  'futureTable.yaml': 'records: [unclosed\n',
};

/** The YAML files a `listFiles` over `RAW_SDE_FILES` reports, in archive order. */
export const RAW_YAML_FILES = Object.keys(RAW_SDE_FILES);

function tempDir(world: World): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esi-bdd-sde-'));
  world.cleanups.push(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A path under a fresh temp directory that no file occupies yet. */
export function tempPath(world: World, name: string): string {
  return path.join(tempDir(world), name);
}

/** Write SDE files to a fresh directory and remember it as the scenario's. */
export function writeSdeDirectory(
  world: World,
  files: Record<string, unknown> = RAW_SDE_FILES,
): string {
  const dir = tempDir(world);
  for (const [name, content] of Object.entries(files)) {
    const text = typeof content === 'string' ? content : yaml.dump(content);
    fs.writeFileSync(path.join(dir, name), text, 'utf-8');
  }
  world.values.sdeDir = dir;
  return dir;
}

/** Archive the scenario's directory and remember the ZIP as the scenario's. */
export function zipSdeDirectory(world: World): string {
  const dir = sdeDirectory(world);
  const zip = new AdmZip();
  for (const name of fs.readdirSync(dir)) {
    zip.addFile(name, fs.readFileSync(path.join(dir, name)));
  }
  const zipPath = tempPath(world, 'sde.zip');
  zip.writeZip(zipPath);
  world.values.sdeZip = zipPath;
  return zipPath;
}

/** A directory and archive path that nothing was ever written to. */
export function absentSdePaths(world: World): void {
  world.values.sdeDir = tempPath(world, 'missing');
  world.values.sdeZip = tempPath(world, 'missing.zip');
}

export function sdeDirectory(world: World): string {
  if (!world.values.sdeDir) {
    throw new Error('No SDE directory; a Given step must write one.');
  }
  return world.values.sdeDir as string;
}

export function sdeArchive(world: World): string {
  if (!world.values.sdeZip) {
    throw new Error('No SDE archive; a Given step must build one.');
  }
  return world.values.sdeZip as string;
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

/** Open the directory with the fixed clock, keeping the provider or the error. */
export function openSdeDirectory(world: World): void {
  try {
    world.sde = SdeDataProvider.fromDirectory(sdeDirectory(world), {
      clock: fixedClock,
    });
  } catch (err) {
    world.error = err;
  }
}

/** Open the archive with the fixed clock, keeping the provider or the error. */
export function openSdeArchive(world: World): void {
  try {
    world.sde = SdeDataProvider.fromZip(sdeArchive(world), {
      clock: fixedClock,
    });
  } catch (err) {
    world.error = err;
  }
}

/** The SdeError a step captured, or a failure naming what was captured instead. */
export function sdeErrorOf(world: World): SdeError {
  if (!(world.error instanceof SdeError)) {
    throw new Error(
      `Expected an SdeError, got ${world.error instanceof Error ? world.error.stack : String(world.error)}`,
    );
  }
  return world.error;
}

// ---------------------------------------------------------------------------
// Optional peers
// ---------------------------------------------------------------------------

export type OptionalPeer = 'js-yaml' | 'adm-zip';

/**
 * Make a peer unresolvable for the rest of the scenario, the way an install
 * without it behaves: requiring it raises Node's module-not-found error.
 */
export function uninstallPeer(world: World, peer: OptionalPeer): void {
  jest.doMock(peer, () => {
    throw Object.assign(new Error(`Cannot find module '${peer}'`), {
      code: 'MODULE_NOT_FOUND',
    });
  });
  world.cleanups.push(() => jest.dontMock(peer));
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Load `./sde` afresh, so the peers a Given step uninstalled are what its
 * modules see, and build a MemorySdeProvider holding Tritanium from it.
 */
export function openMemoryProviderFromFreshSdeEntry(world: World): void {
  let entry: typeof sdeEntry | undefined;
  jest.isolateModules(() => {
    entry = jest.requireActual<typeof sdeEntry>('../../../src/sde/index');
  });
  world.sde = new entry!.MemorySdeProvider({
    types: [
      SdeTestDataFactory.createEveType({ typeId: 34, name: 'Tritanium' }),
    ],
  });
}

export interface EntryPointComparison {
  /** Runtime exports of `./sde` that `./sde/memory` lacks, `SdeDataProvider` aside. */
  missingFromMemory: string[];
  memoryExportsSdeDataProvider: boolean;
}

function runtimeExports(entry: object): string[] {
  return Object.keys(entry).filter((name) => name !== '__esModule');
}

/** What `./sde/memory` exports next to `./sde`, at run time. */
export function compareEntryPoints(): EntryPointComparison {
  const memory = new Set(runtimeExports(memoryEntry));
  return {
    missingFromMemory: runtimeExports(sdeEntry).filter(
      (name) => name !== 'SdeDataProvider' && !memory.has(name),
    ),
    memoryExportsSdeDataProvider: memory.has('SdeDataProvider'),
  };
}

// ---------------------------------------------------------------------------
// The downloader, through the transport seam
// ---------------------------------------------------------------------------

/** What CCP's latest-build feed sends: one JSON object per line, newest last. */
export function queueLatestBuildFeed(lines: unknown[]): void {
  queueResponse({
    match: 'latest.jsonl',
    body: lines.map((line) => JSON.stringify(line)).join('\n') + '\n',
    headers: { 'content-type': 'application/x-ndjson' },
  });
}

export function queueLatestBuildFailure(status: number): void {
  queueResponse({ match: 'latest.jsonl', status, body: '' });
}

/** A non-repeating printable byte sequence of the given length. */
export function archiveBytes(length: number): string {
  let body = '';
  for (let i = 0; i < length; i++) {
    body += String.fromCharCode(33 + ((i * 7 + (i >> 5)) % 94));
  }
  return body;
}

/** Serve an archive of `bytes` known bytes for the download URL, remembering them. */
export function queueArchiveDownload(world: World, bytes: number): void {
  const body = archiveBytes(bytes);
  world.values.archiveBody = body;
  queueResponse({
    match: 'static-data-latest-yaml.zip',
    body,
    headers: {
      'content-type': 'application/zip',
      'content-length': String(bytes),
    },
  });
}

export function queueArchiveDownloadFailure(status: number): void {
  queueResponse({ match: 'static-data-latest-yaml.zip', status, body: '' });
}

export async function fetchLatestBuild(world: World): Promise<void> {
  try {
    world.result = await new SdeDownloader().getLatestBuild();
  } catch (err) {
    world.error = err;
  }
}

/** Download to a temp file, recording every progress report. */
export async function downloadArchive(world: World): Promise<void> {
  const outputPath = tempPath(world, 'download.zip');
  const progress: Array<[number, number]> = [];
  world.values.progress = progress;
  try {
    world.result = await new SdeDownloader().download({
      outputPath,
      onProgress: (downloaded, total) => progress.push([downloaded, total]),
    });
  } catch (err) {
    world.error = err;
  }
}

export function fileSize(filePath: string): number {
  return fs.statSync(filePath).size;
}

/** Whether the file holds exactly the bytes `queueArchiveDownload` served. */
export function fileMatchesServedArchive(
  world: World,
  filePath: string,
): boolean {
  return fs.readFileSync(filePath, 'latin1') === world.values.archiveBody;
}

// ---------------------------------------------------------------------------
// The extractor and the database builder
// ---------------------------------------------------------------------------

export function readArchiveMetadata(world: World): void {
  try {
    world.result = new SdeExtractor().readMetadata(sdeArchive(world));
  } catch (err) {
    world.error = err;
  }
}

export function listArchiveFiles(world: World): void {
  world.result = new SdeExtractor().listFiles(sdeArchive(world));
}

export function parseArchiveFiles(world: World, filenames: string[]): void {
  world.result = new SdeExtractor().parseFiles(sdeArchive(world), filenames);
}

/** The parsed files of the archive that the registry knows, ready to build. */
function parseRegistryFiles(world: World): ParsedSdeFile[] {
  return new SdeExtractor().parseFiles(
    sdeArchive(world),
    SDE_FILE_REGISTRY.map((spec) => spec.yamlFile),
  );
}

/** Build a SQLite database from the archive and remember its path. */
export function buildDatabase(world: World): void {
  const outputPath = tempPath(world, 'sde.sqlite');
  world.values.database = outputPath;
  const metadata = new SdeExtractor().readMetadata(sdeArchive(world));
  try {
    new SdeDatabaseBuilder({ clock: fixedClock }).build({
      outputPath,
      parsedFiles: parseRegistryFiles(world),
      sdeVersion: metadata.buildNumber,
      buildDate: metadata.releaseDate,
    });
  } catch (err) {
    world.error = err;
  }
}

interface SqliteDatabase {
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
  close(): void;
}

type SqliteConstructor = new (
  file: string,
  options?: { readonly?: boolean },
) => SqliteDatabase;

/** better-sqlite3 ships no types; the builder loads it the same way. */
function loadSqlite(): SqliteConstructor {
  return require('better-sqlite3') as SqliteConstructor;
}

export interface BuiltDatabase {
  metadata: Record<string, string>;
  rowCount(table: string): number;
  column(table: string, id: number, column: string): unknown;
}

/** Read the built database back, the way a consumer would. */
export function openBuiltDatabase(world: World): BuiltDatabase {
  const Database = loadSqlite();
  const db = new Database(world.values.database as string, { readonly: true });
  world.cleanups.push(() => db.close());
  const metadata: Record<string, string> = {};
  for (const row of db
    .prepare('SELECT key, value FROM sde_metadata')
    .all() as Array<{ key: string; value: string }>) {
    metadata[row.key] = row.value;
  }
  return {
    metadata,
    rowCount: (table) =>
      (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number })
        .n,
    column: (table, id, column) => {
      const spec = SDE_FILE_REGISTRY.find((s) => s.tableName === table);
      if (!spec) throw new Error(`Unknown SDE table ${table}`);
      const row = db
        .prepare(
          `SELECT ${column} AS v FROM ${table} WHERE ${spec.idAttribute} = ?`,
        )
        .get(id) as { v: unknown } | undefined;
      return row?.v;
    },
  };
}

// ---------------------------------------------------------------------------
// The transforms
// ---------------------------------------------------------------------------

/** `_sde.yaml` text with the build nested under `sde`, at the top level, or both. */
export function metadataText(builds: {
  nested?: string;
  top?: string;
}): string {
  const document: Record<string, unknown> = {};
  if (builds.top !== undefined) {
    document.buildNumber = builds.top;
    document.releaseDate = '2020-01-01';
  }
  if (builds.nested !== undefined) {
    document.sde = {
      buildNumber: builds.nested,
      releaseDate: BUILD.releaseDate,
    };
  }
  return yaml.dump(document);
}

/** Reshape one raw type of `RAW_SDE_FILES` the way the provider or the SQLite build does. */
export function transformRawType(
  typeId: number,
  target: 'provider' | 'sqlite',
): Record<string, unknown> {
  const spec = SDE_FILE_REGISTRY.find((s) => s.yamlFile === 'types.yaml');
  if (!spec) throw new Error('types.yaml is not in the SDE file registry');
  const raw = (
    RAW_SDE_FILES['types.yaml'] as Record<number, Record<string, unknown>>
  )[typeId];
  if (!raw) throw new Error(`No raw type ${typeId} in RAW_SDE_FILES`);
  return target === 'provider'
    ? transformRecordNative(typeId, raw, spec)
    : transformRecord(typeId, raw, spec);
}
