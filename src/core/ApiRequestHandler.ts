import { ApiClient } from './ApiClient';

import {
  trySpecAwareCacheHit,
  cacheResponse,
  handleEarlyStatus,
  handleErrorResponse,
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

    if (response.status === 201) {
      let data: unknown;
      try {
        data = (await response.json()) as unknown;
      } catch {
        data = undefined;
      }
      return finish({ headers: parsed.raw, body: data });
    }

    const earlyResult = handleEarlyStatus(
      client,
      response.status,
      url,
      parsed,
      useETag,
      resolveCache,
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
      );
      return finish(staleOrThrow);
    }

    const data = await parseJsonBody(response, url);
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
    );

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
    );
    return finish(paginatedResult);
  } catch (error: unknown) {
    wrapError(error);
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
    endpoint,
    method,
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
  const specHit = trySpecAwareCacheHit(
    client,
    rawUrl,
    method,
    templatePath,
    resolveCache,
  );
  if (specHit) {
    return applyResponseInterceptors(
      client,
      specHit,
      rawUrl,
      endpoint,
      method,
      startTime,
    );
  }

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

  const operation = () =>
    canDedup
      ? dedup.dedupe<EsiHandlerResponse>(endpoint, doExecute)
      : doExecute();

  const retryStrategy = resolveRetryStrategy(client);

  return retryStrategy.execute<EsiHandlerResponse>(operation, {
    endpoint,
    method,
    requiresAuth,
    refreshToken: client.hasTokenProvider()
      ? () => client.refreshToken().then(() => {})
      : undefined,
  });
};
