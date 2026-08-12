/**
 * Cursor-based Pagination Handler for ESI API calls.
 *
 * New ESI routes (starting with Corporation Projects) use opaque
 * before/after cursor tokens instead of page numbers.
 *
 * Response headers:
 *   x-cursor-before  – token to fetch data preceding the current batch
 *   x-cursor-after   – token to fetch data following the current batch
 *
 * Query parameters:
 *   before=<token>    – crawl backwards
 *   after=<token>     – crawl forwards
 *
 * An empty result array signals the beginning/end of the dataset.
 */

import { ApiClient } from '../ApiClient';
import { logInfo, logWarn, logError } from '../logger/loggerUtil';
import { fetchOnePage } from '../requestPipeline/fetchExecution';
import {
  resolveCache,
  resolveRateLimiter,
  resolveCircuitBreaker,
  resolveRetryStrategy,
} from '../requestPipeline/dependencies';

export interface CursorTokens {
  before: string | null;
  after: string | null;
}

export interface CursorPage<T = unknown> {
  data: T[];
  cursors: CursorTokens;
}

export type CursorPageFetcher = (
  endpoint: string,
  cursor?: { before?: string; after?: string },
) => Promise<CursorPage>;

export interface CursorPaginationOptions {
  maxPages?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class CursorPaginationHandler {
  private static readonly DEFAULT_OPTIONS: Required<CursorPaginationOptions> = {
    maxPages: 1000,
    maxRetries: 3,
    retryDelayMs: 1000,
  };

  /**
   * Fetch a single cursor page, returning data + cursor tokens.
   *
   * When no `pageFetch` callback is provided, the request is routed
   * through the standard request pipeline (rate limiter, circuit
   * breaker, timeout, middleware) instead of a raw `fetch()`.
   */
  static async fetchPage(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    cursor?: { before?: string; after?: string },
    body?: unknown,
    pageFetch?: CursorPageFetcher,
  ): Promise<CursorPage> {
    if (pageFetch) {
      logInfo(`Cursor fetch via callback: ${endpoint}`);
      return pageFetch(endpoint, cursor);
    }

    const endpointWithCursor = this.buildEndpointWithCursor(endpoint, cursor);

    logInfo(`Cursor fetch via pipeline: ${endpointWithCursor}`);

    const { data, parsed } = await fetchOnePage(
      client,
      endpointWithCursor,
      method,
      body,
      requiresAuth,
      false, // useETag — cursor pagination doesn't use ETags
      resolveCache,
      resolveRateLimiter,
      resolveCircuitBreaker,
    );

    const cursors: CursorTokens = {
      before: parsed.cursorBefore,
      after: parsed.cursorAfter,
    };

    let dataArray: unknown[];
    if (Array.isArray(data)) {
      dataArray = data as unknown[];
    } else if (data !== null && data !== undefined) {
      dataArray = [data];
    } else {
      dataArray = [];
    }

    return { data: dataArray, cursors };
  }

  /**
   * Auto-fetch all pages by following `after` tokens until an empty
   * response is received.  Combines the caller-supplied first page
   * data with all subsequent pages.
   */
  static async fetchAll(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    firstPageData: unknown[],
    firstCursors: CursorTokens,
    body?: unknown,
    options: CursorPaginationOptions = {},
    pageFetch?: CursorPageFetcher,
  ): Promise<unknown[]> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const rateLimiter = client.getRateLimiter();
    const allData: unknown[] = [...firstPageData];

    let afterToken = firstCursors.after;
    let pageCount = 1;
    let consecutiveFailures = 0;

    while (afterToken && pageCount < opts.maxPages) {
      try {
        if (rateLimiter) await rateLimiter.checkRateLimit();

        const page = await this.fetchPageWithRetry(
          client,
          endpoint,
          method,
          requiresAuth,
          { after: afterToken },
          body,
          opts,
          pageFetch,
        );

        consecutiveFailures = 0;
        pageCount++;

        if (page.data.length === 0) {
          logInfo('Cursor pagination: empty page received, dataset complete.');
          break;
        }

        allData.push(...page.data);
        afterToken = page.cursors.after;

        logInfo(`Cursor page ${pageCount} fetched (${page.data.length} items)`);
      } catch (error) {
        consecutiveFailures++;
        logError(
          `Cursor page fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        );

        if (consecutiveFailures >= opts.maxRetries) {
          logWarn(
            `${consecutiveFailures} consecutive failures. Stopping cursor pagination.`,
          );
          break;
        }
      }
    }

    logInfo(
      `Cursor pagination complete. ${allData.length} total items from ${pageCount} pages.`,
    );
    return allData;
  }

  /**
   * Fetch a single cursor page with retry logic.
   *
   * Delegates to the configured `IRetryStrategy` (exponential backoff
   * with jitter) instead of implementing a custom retry loop.
   */
  private static async fetchPageWithRetry(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    cursor: { before?: string; after?: string },
    body: unknown,
    _options: Required<CursorPaginationOptions>,
    pageFetch?: CursorPageFetcher,
  ): Promise<CursorPage> {
    const retryStrategy = resolveRetryStrategy(client);

    return retryStrategy.execute(
      () =>
        this.fetchPage(
          client,
          endpoint,
          method,
          requiresAuth,
          cursor,
          body,
          pageFetch,
        ),
      {
        endpoint,
        method,
        requiresAuth,
      },
    );
  }

  /**
   * Extract cursor tokens from response headers.
   */
  static extractCursors(headers: Headers): CursorTokens {
    const get = (name: string) => headers.get(name) || null;
    return {
      before: get('x-cursor-before'),
      after: get('x-cursor-after'),
    };
  }

  /**
   * Build an endpoint path with cursor query parameters appended.
   */
  private static buildEndpointWithCursor(
    endpoint: string,
    cursor?: { before?: string; after?: string },
  ): string {
    if (!cursor) return endpoint;

    const parts: string[] = [];
    if (cursor.before)
      parts.push(`before=${encodeURIComponent(cursor.before)}`);
    if (cursor.after) parts.push(`after=${encodeURIComponent(cursor.after)}`);

    if (parts.length > 0) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return endpoint + separator + parts.join('&');
    }
    return endpoint;
  }
}
