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
import { SdeTestDataFactory } from '../../../src/sde/testing/SdeTestDataFactory';
import { SdeDownloader } from '../../../src/sde/ingestion/SdeDownloader';
import { SdeExtractor } from '../../../src/sde/ingestion/SdeExtractor';
import { SDE_FILE_REGISTRY } from '../../../src/sde/ingestion/constants';
import { transformRecordNative } from '../../../src/sde/ingestion/transforms';
import { queueResponse } from './transport';
import type { World } from './world';

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** The instant every loaded provider is stamped with. */
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

/**
 * The raw export plus a market group tree (roots 2 and 4, group 9 under 4)
 * and a table keyed by strings, listed out of order (ru, fr, zh, de, en), so a
 * root-group, search or whole-table read on the file-backed provider has
 * something to tell apart.
 */
export const EXTENDED_SDE_FILES: Record<string, unknown> = {
  ...RAW_SDE_FILES,
  'marketGroups.yaml': {
    2: { name: { en: 'Blueprints' }, hasTypes: false },
    4: { name: { en: 'Ships' }, hasTypes: false },
    9: { name: { en: 'Frigates' }, parentGroupID: 4, hasTypes: true },
  },
  'translationLanguages.yaml': {
    ru: { name: 'Russian' },
    fr: { name: 'French' },
    zh: { name: 'Chinese' },
    de: { name: 'German' },
    en: { name: 'English' },
  },
};

/**
 * The raw export whose types file also holds a null entry (36) and one
 * that is a bare number (37), neither of them a record.
 */
export const NON_RECORD_SDE_FILES: Record<string, unknown> = {
  ...RAW_SDE_FILES,
  'types.yaml': {
    ...(RAW_SDE_FILES['types.yaml'] as Record<number, unknown>),
    36: null,
    37: 5,
  },
};

/**
 * An export that exercises the record transform: type 34 carries a null field
 * and a nested object, type 35 a fractional volume where type 34's is whole;
 * a table keyed by strings; a file whose records keep their own IDs
 * (characterTitles); and a market groups file with no records at all.
 */
export const SCHEMA_SDE_FILES: Record<string, unknown> = {
  '_sde.yaml': { sde: BUILD },
  'types.yaml': {
    34: {
      name: { en: 'Tritanium' },
      groupID: 18,
      volume: 1,
      basePrice: null,
      traits: { iconID: 7, roleBonuses: [{ bonus: 5 }] },
    },
    35: { name: { en: 'Pyerite' }, groupID: 18, volume: 0.01 },
  },
  'translationLanguages.yaml': {
    de: { name: 'German' },
    en: { name: 'English' },
  },
  'characterTitles.yaml': { captain: { name: { en: 'Captain' } } },
  'marketGroups.yaml': {},
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

/**
 * Archive the scenario's directory inside a `folder/` entry, with a
 * `README.txt` beside the folder, and remember the ZIP as the scenario's.
 */
export function zipSdeDirectoryInFolder(world: World, folder: string): string {
  const dir = sdeDirectory(world);
  const zip = new AdmZip();
  zip.addFile(`${folder}/`, Buffer.alloc(0));
  for (const name of fs.readdirSync(dir)) {
    zip.addFile(`${folder}/${name}`, fs.readFileSync(path.join(dir, name)));
  }
  zip.addFile('README.txt', Buffer.from('Not part of the export.\n'));
  const zipPath = tempPath(world, 'sde.zip');
  zip.writeZip(zipPath);
  world.values.sdeZip = zipPath;
  return zipPath;
}

/** An archive of exactly these entries, each holding one line of YAML. */
export function zipEntries(world: World, names: string[]): string {
  const zip = new AdmZip();
  for (const name of names) {
    zip.addFile(name, Buffer.from(`name: ${JSON.stringify(name)}\n`));
  }
  const zipPath = tempPath(world, 'sde.zip');
  zip.writeZip(zipPath);
  world.values.sdeZip = zipPath;
  return zipPath;
}

/** A fresh, empty directory, remembered as the extraction target. */
export function emptyExtractionTarget(world: World): void {
  world.values.extractDir = tempDir(world);
}

/** Every file under the extraction directory, relative and with forward slashes, sorted. */
export function extractedFiles(world: World): string[] {
  const root = world.values.extractDir as string;
  const found: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else found.push(path.relative(root, full).split(path.sep).join('/'));
    }
  };
  walk(root);
  return found.sort();
}

/** A fresh directory holding `name` with `content`, remembered as the extraction target. */
export function extractionDirectoryHolding(
  world: World,
  name: string,
  content: string,
): void {
  const dir = tempDir(world);
  fs.writeFileSync(path.join(dir, name), content, 'utf-8');
  world.values.extractDir = dir;
}

export function extractArchive(world: World): void {
  new SdeExtractor().extractAll(
    sdeArchive(world),
    world.values.extractDir as string,
  );
}

/** Whether the extracted `name` holds the same bytes as the SDE directory's. */
export function extractedMatchesSource(world: World, name: string): boolean {
  const extracted = fs.readFileSync(
    path.join(world.values.extractDir as string, name),
  );
  return extracted.equals(
    fs.readFileSync(path.join(sdeDirectory(world), name)),
  );
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

function moduleNotFound(peer: string): Error {
  return Object.assign(new Error(`Cannot find module '${peer}'`), {
    code: 'MODULE_NOT_FOUND',
  });
}

/**
 * How a peer can fail to load, and what requiring it throws in each case:
 *
 * - `missing`: Node's CommonJS module-not-found error, as without the peer.
 * - `missing as an ES module`: the ESM resolver's error for the same absence.
 * - `missing a module of its own`: the peer is installed but something it
 *   requires is not, so the module-not-found error names that module.
 * - `an error naming it`: an Error whose message quotes the peer's name but
 *   carries no module-not-found code.
 * - `a thrown string`: the peer throws something that is not an Error.
 */
export const PEER_FAILURES = {
  missing: (peer: string): unknown => moduleNotFound(peer),
  'missing as an ES module': (peer: string): unknown =>
    Object.assign(
      new Error(`Cannot find package '${peer}' imported from /app/index.mjs`),
      { code: 'ERR_MODULE_NOT_FOUND' },
    ),
  'missing a module of its own': (): unknown => moduleNotFound('argparse'),
  'an error naming it': (peer: string): unknown =>
    new Error(`'${peer}' failed to initialise`),
  'a thrown string': (peer: string): unknown => `${peer} is broken`,
} as const;

export type PeerFailure = keyof typeof PEER_FAILURES;

/**
 * Make a peer fail to load for the rest of the scenario, throwing what
 * `PEER_FAILURES[failure]` builds, and keep that value as `world.values.peerFailure`.
 *
 * Both routes a module can take to the peer are closed. Jest's registry
 * answers a plain `require` or `import`; `createRequire`, which
 * `src/sde/optionalPeers.ts` loads the peers through, is replaced for any
 * module loaded afresh after this step, with a require that fails every
 * closed peer and resolves everything else as Node would.
 */
export function failPeer(
  world: World,
  peer: OptionalPeer,
  failure: PeerFailure,
): void {
  const thrown = PEER_FAILURES[failure](peer);
  world.values.peerFailure = thrown;
  const closed: Map<string, unknown> = (world.values.closedPeers ??= new Map());
  closed.set(peer, thrown);
  jest.doMock(peer, () => {
    throw thrown;
  });
  jest.doMock('node:module', () => {
    const actual =
      jest.requireActual<typeof import('node:module')>('node:module');
    return {
      ...actual,
      createRequire: (from: string | URL) => {
        const real = actual.createRequire(from);
        return Object.assign((id: string): unknown => {
          if (closed.has(id)) throw closed.get(id);
          return real(id);
        }, real);
      },
    };
  });
  world.cleanups.push(() => {
    jest.dontMock(peer);
    jest.dontMock('node:module');
  });
}

/**
 * Make a peer unresolvable for the rest of the scenario, the way an install
 * without it behaves: requiring it raises Node's module-not-found error.
 */
export function uninstallPeer(world: World, peer: OptionalPeer): void {
  failPeer(world, peer, 'missing');
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

/**
 * Load `./sde` afresh, so its modules, `optionalPeers.ts` included, run
 * against the peers a Given step uninstalled, and build a MemorySdeProvider
 * holding Tritanium from it. A peer loaded at import time throws here.
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

/**
 * Serve an archive of `bytes` known bytes with no content-length header, so
 * the downloader cannot know the total; `delayMs` holds the response back.
 */
export function queueArchiveDownloadWithoutLength(
  world: World,
  bytes: number,
  delayMs?: number,
): void {
  const body = archiveBytes(bytes);
  world.values.archiveBody = body;
  queueResponse({
    match: 'static-data-latest-yaml.zip',
    body,
    headers: { 'content-type': 'application/zip' },
    ...(delayMs === undefined ? {} : { delayMs }),
  });
}

/** Serve the latest-build feed as exactly this text. */
export function queueLatestBuildFeedText(text: string): void {
  queueResponse({
    match: 'latest.jsonl',
    body: text,
    headers: { 'content-type': 'application/x-ndjson' },
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

/**
 * Download to a temp file, recording every progress report. `outputPath`
 * overrides the file; `abortAfterMs` aborts the download's signal that long
 * after it starts.
 */
export async function downloadArchive(
  world: World,
  options: {
    outputPath?: string;
    abortAfterMs?: number;
    maxBytes?: number;
  } = {},
): Promise<void> {
  const outputPath = options.outputPath ?? tempPath(world, 'download.zip');
  world.values.downloadPath = outputPath;
  const progress: Array<[number, number]> = [];
  world.values.progress = progress;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (options.abortAfterMs !== undefined) {
    timer = setTimeout(() => controller.abort(), options.abortAfterMs);
  }
  try {
    world.result = await new SdeDownloader().download({
      outputPath,
      onProgress: (downloaded, total) => progress.push([downloaded, total]),
      signal: controller.signal,
      ...(options.maxBytes === undefined ? {} : { maxBytes: options.maxBytes }),
    });
  } catch (err) {
    world.error = err;
  } finally {
    clearTimeout(timer);
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
// The extractor
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

// ---------------------------------------------------------------------------
// The transforms
// ---------------------------------------------------------------------------

/** `_sde.yaml` text whose build number is a bare number and release date a boolean. */
export function untypedMetadataText(buildNumber: number): string {
  return yaml.dump({ buildNumber, releaseDate: true });
}

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

/** Reshape one raw record of `files` the way the provider does. */
export function transformRawRecord(
  files: Record<string, unknown>,
  yamlFile: string,
  id: number | string,
): Record<string, unknown> {
  const spec = SDE_FILE_REGISTRY.find((s) => s.yamlFile === yamlFile);
  if (!spec) throw new Error(`${yamlFile} is not in the SDE file registry`);
  const raw = (files[yamlFile] as Record<string, Record<string, unknown>>)[
    String(id)
  ];
  if (!raw) throw new Error(`No raw record ${id} in ${yamlFile}`);
  return transformRecordNative(id, raw, spec);
}

/** Reshape one raw type of `RAW_SDE_FILES` the way the provider does. */
export function transformRawType(typeId: number): Record<string, unknown> {
  const spec = SDE_FILE_REGISTRY.find((s) => s.yamlFile === 'types.yaml');
  if (!spec) throw new Error('types.yaml is not in the SDE file registry');
  const raw = (
    RAW_SDE_FILES['types.yaml'] as Record<number, Record<string, unknown>>
  )[typeId];
  if (!raw) throw new Error(`No raw type ${typeId} in RAW_SDE_FILES`);
  return transformRecordNative(typeId, raw, spec);
}
