import { EsiError } from './util/error';
import { logDebug, logInfo } from './logger/loggerUtil';

export interface BatchOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
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
  const concurrency = options.concurrency ?? 20;
  const results = new Map<K, T>();
  const errors = new Map<K, EsiError | Error>();
  let completed = 0;
  let running = 0;
  let index = 0;

  logInfo(`Batch fetch: ${keys.length} items, concurrency=${concurrency}`);

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
                `Batch complete: ${results.size} succeeded, ${errors.size} failed`,
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
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  logInfo(
    `Batch POST: ${ids.length} IDs in ${chunks.length} chunks of ${chunkSize}`,
  );

  const results: T[] = [];
  for (const chunk of chunks) {
    const chunkResult = await poster(chunk);
    results.push(...chunkResult);
  }

  return results;
}
