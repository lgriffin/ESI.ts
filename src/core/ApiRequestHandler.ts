import { ApiClient } from './ApiClient';
import { buildDedupeKey } from './cache/cacheKey';

import {
  trySpecAwareCacheHit,
  cacheResponse,
  currentWriteGeneration,
  hasCachedEntry,
  invalidateAfterWrite,
  handleEarlyStatus,
  handleErrorResponse,
  readEsiErrorReason,
  wrapError,
  handleCursorPagination,
  handleOffsetPagination,
  applyResponseInterceptors,
  executeSingleFetch,
  fetchOnePage,
  parseJsonBody,
  resolveCache,
  resolveRateLimiter,
  resolveCircuitBreaker,
  resolveRetryStrategy,
} from './requestPipeline';
export type { EsiHandlerResponse } from './requestPipeline';
import type { EsiHandlerResponse } from './requestPipeline';

// --- Main request orchestration ---

const executeRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
  requestTimeout?: number,
  templatePath?: string,
): Promise<EsiHandlerResponse> => {
  const startTime = Date.now();
  const finish = (r: EsiHandlerResponse) => {
    r.responseTimeMs = Date.now() - startTime;
    const rawUrl = `${client.getLink()}/${endpoint}`;
    return applyResponseInterceptors(
      client,
      r,
      rawUrl,
      endpoint,
      method,
      startTime,
    );
  };

  try {
    const writeGeneration = currentWriteGeneration(client, resolveCache);
    const revalidating =
      useETag &&
      method === 'GET' &&
      hasCachedEntry(
        client,
        `${client.getLink()}/${endpoint}`,
        resolveCache,
        requiresAuth,
      );
    const { response, parsed, url } = await executeSingleFetch(
      client,
      endpoint,
      method,
      body,
      requiresAuth,
      useETag,
      resolveCache,
      resolveRateLimiter,
      resolveCircuitBreaker,
      requestTimeout,
      templatePath,
    );

    if (response.status === 201 || response.status === 204) {
      invalidateAfterWrite(client, method, endpoint, resolveCache);
    }

    if (response.status === 201) {
      let data: unknown;
      try {
        data = (await response.json()) as unknown;
      } catch {
        data = undefined;
      }
      return finish({ headers: parsed.raw, body: data, status: 201 });
    }

    if (
      response.status === 304 &&
      revalidating &&
      !hasCachedEntry(client, url, resolveCache, requiresAuth)
    ) {
      // The entry this request revalidated left the cache while it was in
      // flight (a write to its path evicted it, or it expired), so the 304 has
      // no body to stand for. The repeat finds no entry, sends no
      // If-None-Match and gets the current representation.
      return await executeRequest(
        client,
        endpoint,
        method,
        body,
        requiresAuth,
        useETag,
        requestTimeout,
        templatePath,
      );
    }

    const earlyResult = handleEarlyStatus(
      client,
      response.status,
      url,
      parsed,
      useETag,
      resolveCache,
      requiresAuth,
    );
    if (earlyResult) return finish(earlyResult);

    if (!response.ok) {
      const staleOrThrow = handleErrorResponse(
        client,
        response,
        url,
        parsed,
        useETag,
        resolveCache,
        requiresAuth,
        await readEsiErrorReason(response),
      );
      return finish(staleOrThrow);
    }

    const data = await parseJsonBody(client, response, url);
    // A multi-page response is cached by handleOffsetPagination once every
    // page is in. Caching page 1 here would let a retried call revalidate
    // against page 1 alone and resolve with it after a 304.
    if (parsed.xPages <= 1 || parsed.hasCursorPagination) {
      cacheResponse(
        client,
        url,
        method,
        endpoint,
        parsed,
        data,
        useETag,
        resolveCache,
        templatePath,
        requiresAuth,
        writeGeneration,
      );
    }

    const cursorResult = handleCursorPagination(parsed, data);
    if (cursorResult) return finish(cursorResult);

    const pageFetch = async (paginatedEndpoint: string): Promise<unknown[]> => {
      const result = await fetchOnePage(
        client,
        paginatedEndpoint,
        method,
        body,
        requiresAuth,
        false,
        resolveCache,
        resolveRateLimiter,
        resolveCircuitBreaker,
        requestTimeout,
        templatePath,
      );
      return Array.isArray(result.data)
        ? (result.data as unknown[])
        : [result.data];
    };

    const paginatedResult = await handleOffsetPagination(
      client,
      endpoint,
      method,
      requiresAuth,
      parsed,
      data,
      body,
      url,
      useETag,
      pageFetch,
      resolveCache,
      templatePath,
      writeGeneration,
    );
    return finish(paginatedResult);
  } catch (error: unknown) {
    wrapError(error, client);
  }
};

export const handleSinglePageRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  templatePath?: string,
  requestTimeout?: number,
): Promise<EsiHandlerResponse> => {
  const doExecute = () =>
    fetchOnePage(
      client,
      endpoint,
      method,
      body,
      requiresAuth,
      true,
      resolveCache,
      resolveRateLimiter,
      resolveCircuitBreaker,
      requestTimeout,
      templatePath,
    ).then(({ data, parsed }) => ({
      headers: parsed.raw,
      body: data,
    }));

  const retryStrategy = resolveRetryStrategy(client);

  return retryStrategy.execute<EsiHandlerResponse>(doExecute, {
    client,
    endpoint,
    method: 'GET',
    requiresAuth,
    refreshToken: client.hasTokenProvider()
      ? () => client.refreshToken().then(() => {})
      : undefined,
  });
};

export const handleRequest = async (
  client: ApiClient,
  endpoint: string,
  method: string,
  body?: unknown,
  requiresAuth: boolean = false,
  useETag: boolean = true,
  templatePath?: string,
  requestTimeout?: number,
): Promise<EsiHandlerResponse> => {
  const rawUrl = `${client.getLink()}/${endpoint}`;
  const startTime = Date.now();
  const specCacheHit = (): Promise<EsiHandlerResponse> | null => {
    const hit = trySpecAwareCacheHit(
      client,
      rawUrl,
      method,
      templatePath,
      resolveCache,
      requiresAuth,
    );
    return hit
      ? applyResponseInterceptors(
          client,
          hit,
          rawUrl,
          endpoint,
          method,
          startTime,
        )
      : null;
  };
  const specHit = specCacheHit();
  if (specHit) return specHit;

  const doExecute = () =>
    executeRequest(
      client,
      endpoint,
      method,
      body,
      requiresAuth,
      useETag,
      requestTimeout,
      templatePath,
    );

  const dedup = client.getDeduplicator();
  const canDedup = dedup && method === 'GET' && !body;

  let attempted = false;
  const operation = () => {
    // A retry waited out a backoff, during which a concurrent call may have
    // cached a fresh copy. Serve it rather than spend another request.
    const retryHit = attempted ? specCacheHit() : null;
    attempted = true;
    if (retryHit) return retryHit;
    // Keyed by identity as well as endpoint: one client can hold more than one
    // token over its life, and two concurrent authenticated GETs under
    // different tokens must not be answered from one response.
    return canDedup
      ? dedup.dedupe<EsiHandlerResponse>(
          buildDedupeKey(endpoint, client, requiresAuth),
          doExecute,
        )
      : doExecute();
  };

  const retryStrategy = resolveRetryStrategy(client);

  return retryStrategy.execute<EsiHandlerResponse>(operation, {
    client,
    endpoint,
    method,
    requiresAuth,
    refreshToken: client.hasTokenProvider()
      ? () => client.refreshToken().then(() => {})
      : undefined,
  });
};
