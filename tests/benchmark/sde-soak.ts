/**
 * The SDE heap soak: load an export, answer a large number of lookups, close
 * the provider, and repeat, recording what the process retains at each step.
 *
 * A consumer that reloads the export (a new build arrived, a worker
 * restarted its provider) must get the memory back: after `close()` and two
 * full collections the heap must return to where it was before the load,
 * within a tolerance, on every cycle, and each cycle's loaded heap must not
 * sit above the previous one. `scripts/bench/soak-core.ts` decides.
 *
 * The lookups are the mix a consumer issues: eight in ten `getType` by ID,
 * one in ten a group or category by ID, one in ten a foreign-key list, and
 * one in a hundred a name search. Keys come from a seeded generator over the
 * IDs the export holds, so every run asks the same questions.
 */
import { SdeDataProvider } from '../../src/sde/providers/yaml/SdeDataProvider';
import type { EveType } from '../../src/sde/domain/types';

export interface SdeSoakOptions {
  /** The export directory `SdeDataProvider.fromDirectory` reads. */
  dir: string;
  /** Load, look up, close: this many times. */
  cycles: number;
  /** Lookups per cycle. */
  lookups: number;
  /** A full, synchronous garbage collection (`global.gc` under --expose-gc). */
  gc: () => void;
}

export interface SdeSoakCycle {
  /** Wall-clock time of `fromDirectory`, milliseconds. */
  loadMs: number;
  /** `heapUsed` after two full collections with the provider loaded. */
  heapAfterLoad: number;
  /** Resident set after the load, before any lookup. */
  rssAfterLoad: number;
  /** The largest `heapUsed` seen during the lookups, no collection forced. */
  peakHeap: number;
  /** Wall-clock time of the lookups, milliseconds. */
  lookupsMs: number;
  /** `heapUsed` after `close()` and two full collections. */
  heapAfterClose: number;
  /** Types the export loaded. */
  types: number;
  /** Lookups that answered a record (a `null` or an empty list is a miss). */
  hits: number;
}

export interface SdeSoakRun {
  options: Omit<SdeSoakOptions, 'gc'>;
  build: string;
  /** `heapUsed` after two full collections before the first load. */
  heapBaseline: number;
  cycles: SdeSoakCycle[];
  unexpectedErrors: string[];
  durationMs: number;
}

export const SDE_SOAK_DEFAULTS: Omit<SdeSoakOptions, 'gc' | 'dir'> = {
  cycles: 3,
  lookups: 100_000,
};

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function settle(gc: () => void): number {
  gc();
  gc();
  return process.memoryUsage().heapUsed;
}

/** Yield to the event loop so a long synchronous stretch stays cooperative. */
function yieldNow(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

interface LookupKeys {
  typeIds: number[];
  groupIds: number[];
  categoryIds: number[];
  fragments: string[];
}

function pickFrom<T>(
  values: readonly T[],
  random: () => number,
): T | undefined {
  return values[Math.floor(random() * values.length)];
}

/** The i-th lookup of the mix described above. */
function lookup(
  provider: SdeDataProvider,
  keys: LookupKeys,
  random: () => number,
  i: number,
): unknown {
  if (i % 100 === 99) {
    return provider.searchTypesByName(
      pickFrom(keys.fragments, random) ?? '',
      25,
    );
  }
  switch (i % 10) {
    case 8:
      return i % 20 === 8
        ? provider.getGroup(pickFrom(keys.groupIds, random) ?? -1)
        : provider.getCategory(pickFrom(keys.categoryIds, random) ?? -1);
    case 9:
      return provider.getTypesByGroup(pickFrom(keys.groupIds, random) ?? -1);
    default:
      return provider.getType(pickFrom(keys.typeIds, random) ?? -1);
  }
}

/** A record or a non-empty list is a hit; `null` and `[]` are misses. */
function answered(result: unknown): boolean {
  return result !== null && !(Array.isArray(result) && result.length === 0);
}

interface CycleMeasurement extends Omit<SdeSoakCycle, 'heapAfterClose'> {
  build: string;
  errors: string[];
}

/**
 * One cycle, in its own frame: every reference to the loaded records lives
 * here and is gone when it returns, so the caller's collection after it
 * measures what the provider itself left behind.
 */
async function runCycle(
  options: SdeSoakOptions,
  cycle: number,
): Promise<CycleMeasurement> {
  const { gc } = options;
  const errors: string[] = [];
  const loadStarted = performance.now();
  const provider = SdeDataProvider.fromDirectory(options.dir);
  const loadMs = performance.now() - loadStarted;
  const build = provider.getVersion().version;

  const types = provider.getAllEntities<EveType>('eve_types');
  const typeIds = types.map((t) => t.typeId);
  const groupIds = [...new Set(types.map((t) => t.groupId))];
  const categoryIds = provider.getAllCategories().map((c) => c.categoryId);
  const fragments = types
    .slice(0, 50)
    .map((t) => t.name.slice(0, 4).toLowerCase());
  const typeCount = types.length;
  types.length = 0;
  const heapAfterLoad = settle(gc);
  const rssAfterLoad = process.memoryUsage().rss;

  const keys: LookupKeys = { typeIds, groupIds, categoryIds, fragments };
  const random = lcg(cycle + 1);
  let peakHeap = heapAfterLoad;
  let hits = 0;
  const chunk = 5000;
  const lookupsStarted = performance.now();
  try {
    for (let done = 0; done < options.lookups; done += chunk) {
      const end = Math.min(options.lookups, done + chunk);
      for (let i = done; i < end; i++) {
        if (answered(lookup(provider, keys, random, i))) hits++;
      }
      peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed);
      await yieldNow();
    }
  } catch (error) {
    errors.push(String(error));
  }
  const lookupsMs = performance.now() - lookupsStarted;
  provider.close();

  return {
    build,
    errors,
    loadMs: Math.round(loadMs),
    heapAfterLoad,
    rssAfterLoad,
    peakHeap,
    lookupsMs: Math.round(lookupsMs),
    types: typeCount,
    hits,
  };
}

export async function runSdeSoak(options: SdeSoakOptions): Promise<SdeSoakRun> {
  const { gc, ...recorded } = options;
  const unexpectedErrors: string[] = [];
  const started = performance.now();
  const heapBaseline = settle(gc);
  const cycles: SdeSoakCycle[] = [];
  let build = 'unknown';

  for (let cycle = 0; cycle < options.cycles; cycle++) {
    const {
      build: loadedBuild,
      errors,
      ...measured
    } = await runCycle(options, cycle);
    build = loadedBuild;
    unexpectedErrors.push(...errors);
    cycles.push({ ...measured, heapAfterClose: settle(gc) });
  }

  return {
    options: recorded,
    build,
    heapBaseline,
    cycles,
    unexpectedErrors: unexpectedErrors.slice(0, 20),
    durationMs: Math.round(performance.now() - started),
  };
}
