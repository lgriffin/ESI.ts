import { EsiError } from './util/error';
import type { ApiClient } from './ApiClient';
import { logDebug, logInfo } from './logger/clientLog';

export interface BatchOptions {
  concurrency?: number | undefined;
  onProgress?: ((completed: number, total: number) => void) | undefined;
}

export interface BatchResult<K, T> {
  results: Map<K, T>;
  errors: Map<K, EsiError | Error>;
}

export async function batchFetch<K, T>(
  keys: K[],
  fetcher: (key: K) => Promise<T>,
  options: BatchOptions = {},
): Promise<BatchResult<K, T>> {
  return batchFetchFor(null, keys, fetcher, options);
}

/**
 * `batchFetch` logging to a client's logger. Not exported from the package:
 * `EsiClient.batch` calls it with its own client, the standalone
 * `batchFetch` with none (the global logger).
 */
export async function batchFetchFor<K, T>(
  client: ApiClient | null,
  keys: K[],
  fetcher: (key: K) => Promise<T>,
  options: BatchOptions = {},
): Promise<BatchResult<K, T>> {
  const concurrency = options.concurrency ?? 20;
  const results = new Map<K, T>();
  const errors = new Map<K, EsiError | Error>();
  let completed = 0;
  let running = 0;
  let index = 0;

  logInfo(
    client,
    `Batch fetch: ${keys.length} items, concurrency=${concurrency}`,
    {
      total: keys.length,
      concurrency,
    },
  );

  return new Promise((resolve) => {
    function next(): void {
      while (running < concurrency && index < keys.length) {
        const currentIndex = index++;
        const key = keys[currentIndex]!;
        running++;

        fetcher(key)
          .then((result) => {
            results.set(key, result);
          })
          .catch((err: unknown) => {
            const error =
              err instanceof EsiError || err instanceof Error
                ? err
                : new Error(String(err));
            errors.set(key, error);
          })
          .finally(() => {
            running--;
            completed++;
            if (options.onProgress) {
              options.onProgress(completed, keys.length);
            }
            if (completed === keys.length) {
              logDebug(
                client,
                `Batch complete: ${results.size} succeeded, ${errors.size} failed`,
                { succeeded: results.size, failed: errors.size },
              );
              resolve({ results, errors });
            } else {
              next();
            }
          });
      }
    }

    if (keys.length === 0) {
      resolve({ results, errors });
      return;
    }

    next();
  });
}

export async function batchPost<T>(
  ids: number[],
  poster: (chunk: number[]) => Promise<T[]>,
  chunkSize: number = 1000,
): Promise<T[]> {
  return batchPostFor(null, ids, poster, chunkSize);
}

/**
 * `batchPost` logging to a client's logger; see `batchFetchFor`.
 */
export async function batchPostFor<T>(
  client: ApiClient | null,
  ids: number[],
  poster: (chunk: number[]) => Promise<T[]>,
  chunkSize: number = 1000,
): Promise<T[]> {
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  logInfo(
    client,
    `Batch POST: ${ids.length} IDs in ${chunks.length} chunks of ${chunkSize}`,
    { total: ids.length, chunks: chunks.length, chunkSize },
  );

  const results: T[] = [];
  for (const chunk of chunks) {
    const chunkResult = await poster(chunk);
    results.push(...chunkResult);
  }

  return results;
}
