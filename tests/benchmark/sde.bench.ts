/**
 * The SDE benchmark tasks (Track S Run 10): what a consumer pays to load an
 * export with `SdeDataProvider.fromDirectory` and to answer lookups from it.
 *
 * By default the tasks run against a generated export: `SDE_BENCH_TYPES`
 * types (50 000 unless set) spread over groups and categories, written as
 * CCP-shaped YAML into a temporary directory once per process and removed at
 * exit. The generator is seeded, so every process, every round and both sides
 * of an A/B comparison read the same bytes. With `SDE_BENCH_DIR` set (the
 * nightly SDE run points it at the real export) the tasks load that directory
 * instead and draw their lookup keys from what it holds.
 *
 * Task names carry the data set's label, so the synthetic series and the real
 * export never share one name in a comparison or a trend.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { SdeDataProvider } from '../../src/sde/SdeDataProvider';
import type { EveType } from '../../src/sde/types';
import type { BenchTask } from './tasks';

export const DEFAULT_SDE_BENCH_TYPES = 50_000;

/** Fragments that many generated type names share; a search stops at its limit. */
const ADJECTIVES = [
  'Small',
  'Medium',
  'Large',
  'Heavy',
  'Light',
  'Compact',
  'Scoped',
  'Enduring',
  'Republic',
  'Federation',
  'Imperial',
  'Caldari',
];
const NOUNS = [
  'Frigate',
  'Cruiser',
  'Battleship',
  'Autocannon',
  'Railgun',
  'Blaster',
  'Launcher',
  'Shield Extender',
  'Armor Plate',
  'Afterburner',
  'Microwarpdrive',
  'Warp Scrambler',
  'Ore Hold',
  'Drone',
  'Cargo Container',
  'Blueprint',
];

export interface SdeBenchDataset {
  categories: Array<{ categoryId: number; name: string }>;
  groups: Array<{ groupId: number; categoryId: number; name: string }>;
  types: Array<{
    typeId: number;
    groupId: number;
    name: string;
    mass: number;
    volume: number;
    basePrice: number | null;
    published: boolean;
  }>;
}

/** A 32-bit linear congruential generator: deterministic and dependency-free. */
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Generate `typeCount` types over `typeCount / 100` groups (at least one) and
 * 25 categories, with the same result for the same count.
 */
export function generateSdeDataset(typeCount: number): SdeBenchDataset {
  if (!Number.isInteger(typeCount) || typeCount < 1) {
    throw new Error(`SDE bench: type count must be a positive integer`);
  }
  const random = lcg(typeCount);
  const categoryCount = 25;
  const groupCount = Math.max(1, Math.floor(typeCount / 100));

  const categories = Array.from({ length: categoryCount }, (_, i) => ({
    categoryId: i + 1,
    name: `Category ${i + 1}`,
  }));
  const groups = Array.from({ length: groupCount }, (_, i) => ({
    groupId: 100 + i,
    categoryId: 1 + (i % categoryCount),
    name: `${NOUNS[i % NOUNS.length]} Group ${i + 1}`,
  }));
  const types = Array.from({ length: typeCount }, (_, i) => {
    const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)]!;
    const noun = NOUNS[Math.floor(random() * NOUNS.length)]!;
    const mark = i + 1;
    return {
      typeId: 1000 + i,
      groupId: 100 + Math.floor(random() * groupCount),
      name: `${adjective} ${noun} Mk ${mark}`,
      mass: Math.round(random() * 1_000_000) / 100,
      volume: Math.round(random() * 100_000) / 100,
      basePrice: random() < 0.7 ? Math.round(random() * 1e8) / 100 : null,
      published: random() < 0.9,
    };
  });
  return { categories, groups, types };
}

/** Double-quoted YAML scalars are JSON strings, so JSON.stringify is exact. */
function scalar(value: string | number | boolean | null): string {
  return value === null ? 'null' : JSON.stringify(value);
}

/**
 * Write the data set as the three YAML files CCP ships them as (`typeID`
 * style keys, `name: {en: ...}` locale maps) plus `_sde.yaml`, so the
 * provider's own transforms run on every record exactly as they do on the
 * real export.
 */
export function writeSdeDataset(dir: string, dataset: SdeBenchDataset): void {
  mkdirSync(dir, { recursive: true });
  const build = `bench-${dataset.types.length}`;
  writeFileSync(
    path.join(dir, '_sde.yaml'),
    `buildNumber: ${scalar(build)}\nreleaseDate: "2026-01-01"\n`,
  );

  const categories: string[] = [];
  for (const c of dataset.categories) {
    categories.push(
      `${c.categoryId}:`,
      `  name:`,
      `    en: ${scalar(c.name)}`,
      `  published: true`,
    );
  }
  writeFileSync(
    path.join(dir, 'categories.yaml'),
    `${categories.join('\n')}\n`,
  );

  const groups: string[] = [];
  for (const g of dataset.groups) {
    groups.push(
      `${g.groupId}:`,
      `  anchorable: false`,
      `  anchored: false`,
      `  categoryID: ${g.categoryId}`,
      `  fittableNonSingleton: false`,
      `  name:`,
      `    en: ${scalar(g.name)}`,
      `  published: true`,
      `  useBasePrice: true`,
    );
  }
  writeFileSync(path.join(dir, 'groups.yaml'), `${groups.join('\n')}\n`);

  const types: string[] = [];
  for (const t of dataset.types) {
    const description = `${t.name}, a generated type for the benchmark.`;
    types.push(
      `${t.typeId}:`,
      `  groupID: ${t.groupId}`,
      `  name:`,
      `    en: ${scalar(t.name)}`,
      `  description:`,
      `    en: ${scalar(description)}`,
      `  mass: ${t.mass}`,
      `  volume: ${t.volume}`,
      `  portionSize: 1`,
      `  published: ${t.published}`,
    );
    if (t.basePrice !== null) types.push(`  basePrice: ${t.basePrice}`);
  }
  writeFileSync(path.join(dir, 'types.yaml'), `${types.join('\n')}\n`);
}

export interface SdeBenchData {
  /** The directory `SdeDataProvider.fromDirectory` reads. */
  dir: string;
  /** "50k types" for a generated set, "real export" for `SDE_BENCH_DIR`. */
  label: string;
  generated: boolean;
}

let shared: SdeBenchData | undefined;

/** The data set's label, from the environment alone, with nothing written. */
export function sdeBenchLabel(): string {
  if (process.env.SDE_BENCH_DIR) return 'real export';
  const count = sdeBenchTypeCount();
  return count % 1000 === 0 ? `${count / 1000}k types` : `${count} types`;
}

/** The type count a generated set uses: `SDE_BENCH_TYPES`, else the default. */
export function sdeBenchTypeCount(): number {
  const raw = process.env.SDE_BENCH_TYPES;
  if (!raw) return DEFAULT_SDE_BENCH_TYPES;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`SDE_BENCH_TYPES must be a positive integer, got '${raw}'`);
  }
  return count;
}

/**
 * The directory every SDE task in this process reads: `SDE_BENCH_DIR` when
 * set, otherwise a generated set written once and removed when the process
 * exits.
 */
export function sdeBenchData(): SdeBenchData {
  if (shared) return shared;
  const real = process.env.SDE_BENCH_DIR;
  if (real) {
    shared = {
      dir: path.resolve(real),
      label: sdeBenchLabel(),
      generated: false,
    };
    return shared;
  }
  const count = sdeBenchTypeCount();
  const dir = mkdtempSync(path.join(tmpdir(), 'esi-sde-bench-'));
  writeSdeDataset(dir, generateSdeDataset(count));
  process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
  shared = { dir, label: sdeBenchLabel(), generated: true };
  return shared;
}

/** Keys cycle through a fixed set so batched iterations stay allocation-free. */
function cycle<T>(values: readonly T[]): () => T {
  if (values.length === 0) throw new Error('SDE bench: nothing to cycle over');
  let i = 0;
  return () => {
    const value = values[i]!;
    i = (i + 1) % values.length;
    return value;
  };
}

/** Every `step`-th element, at most `limit` of them. */
function sample<T>(values: readonly T[], limit: number): T[] {
  const step = Math.max(1, Math.floor(values.length / limit));
  const picked: T[] = [];
  for (let i = 0; i < values.length && picked.length < limit; i += step) {
    picked.push(values[i]!);
  }
  return picked;
}

interface LoadedProvider {
  provider: SdeDataProvider;
  typeIds: number[];
  groupIds: number[];
  /** A fragment many names share, so a search stops at its limit. */
  commonFragment: string;
  /** One whole name, so a search scans until it finds it. */
  rareFragment: string;
}

function loadProvider(): LoadedProvider {
  const { dir } = sdeBenchData();
  const provider = SdeDataProvider.fromDirectory(dir);
  const types = provider.getAllEntities<EveType>('eve_types');
  if (types.length === 0) {
    throw new Error(`SDE bench: ${dir} holds no types`);
  }
  const typeIds = sample(types, 1000).map((t) => t.typeId);
  const groupIds = [...new Set(sample(types, 200).map((t) => t.groupId))];
  const first = types[0]!.name;
  return {
    provider,
    typeIds,
    groupIds,
    commonFragment: first.slice(0, Math.min(3, first.length)).toLowerCase(),
    rareFragment: types[types.length - 1]!.name.toLowerCase(),
  };
}

/** The lazily built foreign-key indexes, cleared to time a cold query. */
function fkIndexes(provider: SdeDataProvider): Map<string, unknown> {
  const indexes = (provider as unknown as { fkIndexes?: unknown }).fkIndexes;
  if (!(indexes instanceof Map)) {
    throw new Error(
      'SDE bench: SdeDataProvider no longer keeps its foreign-key indexes in `fkIndexes`; update the cold-index task',
    );
  }
  return indexes;
}

function sdeTask(
  what: string,
  build: (loaded: LoadedProvider) => () => unknown,
  minSamples?: number,
): BenchTask {
  return {
    get name() {
      return `sde/${what}, ${sdeBenchLabel()}`;
    },
    minSamples,
    setup() {
      const loaded = loadProvider();
      return {
        fn: build(loaded),
        teardown: () => loaded.provider.close(),
      };
    },
  };
}

export const sdeTasks: BenchTask[] = [
  {
    get name() {
      return `sde/fromDirectory load, ${sdeBenchLabel()}`;
    },
    // One operation reads and transforms the whole set, so fewer samples
    // than a nanosecond-scale task; the per-process median still decides.
    minSamples: 8,
    setup() {
      const { dir } = sdeBenchData();
      return {
        fn: () => {
          const provider = SdeDataProvider.fromDirectory(dir);
          const version = provider.getVersion();
          provider.close();
          return version;
        },
      };
    },
  },
  sdeTask('getType by ID', ({ provider, typeIds }) => {
    const next = cycle(typeIds);
    return () => provider.getType(next());
  }),
  sdeTask('getTypesByGroup, index built', ({ provider, groupIds }) => {
    const next = cycle(groupIds);
    provider.getTypesByGroup(next());
    return () => provider.getTypesByGroup(next());
  }),
  sdeTask(
    'getTypesByGroup, cold (builds the index)',
    ({ provider, groupIds }) => {
      const indexes = fkIndexes(provider);
      const next = cycle(groupIds);
      return () => {
        indexes.clear();
        return provider.getTypesByGroup(next());
      };
    },
    8,
  ),
  sdeTask(
    'searchTypesByName, common fragment (stops at the limit)',
    ({ provider, commonFragment }) =>
      () =>
        provider.searchTypesByName(commonFragment),
  ),
  sdeTask(
    'searchTypesByName, one whole name (scans the table)',
    ({ provider, rareFragment }) =>
      () =>
        provider.searchTypesByName(rareFragment),
    8,
  ),
];
