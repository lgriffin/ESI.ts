/**
 * Writes seen by a cache, so a read that was in flight when one of them
 * invalidated its path does not store the pre-write body afterwards.
 * `recent` keeps the last RECENT_WRITES paths; a read that outlived more
 * writes than that is treated as overtaken. A write another process
 * published through a shared `CacheStore` is recorded here too (see
 * `CacheStoreCache`), so it stops this process's in-flight reads the same
 * way; a cleared store records the empty path, which every key contains.
 */
import type { ICache } from './ICache';

interface WriteLog {
  generation: number;
  recent: { generation: number; path: string }[];
}

const RECENT_WRITES = 64;
const writeLogs = new WeakMap<ICache, WriteLog>();

function writeLogFor(cache: ICache): WriteLog {
  let log = writeLogs.get(cache);
  if (!log) {
    log = { generation: 0, recent: [] };
    writeLogs.set(cache, log);
  }
  return log;
}

/** The cache's write generation, taken before a GET is sent. */
export function writeGenerationOf(cache: ICache): number {
  return writeLogFor(cache).generation;
}

/** Records that the entries under `path` were invalidated. */
export function recordWrite(cache: ICache, path: string): void {
  const log = writeLogFor(cache);
  log.generation += 1;
  log.recent.push({ generation: log.generation, path });
  if (log.recent.length > RECENT_WRITES) log.recent.shift();
}

/** Whether a write since `generation` invalidated a path `key` falls under. */
export function invalidatedSince(
  cache: ICache,
  generation: number,
  key: string,
): boolean {
  const log = writeLogFor(cache);
  if (log.generation === generation) return false;
  if (log.generation - generation > log.recent.length) return true;
  return log.recent.some(
    (write) => write.generation > generation && key.includes(write.path),
  );
}
