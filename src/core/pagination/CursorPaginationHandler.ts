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
import { RateLimiter } from '../rateLimiter/RateLimiter';

export interface CursorTokens {
  before: string | null;
  after: string | null;
}

export interface CursorPage<T = unknown> {
  data: T[];
  cursors: CursorTokens;
}

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
   */
  static async fetchPage(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    cursor?: { before?: string; after?: string },
    body?: unknown,
  ): Promise<CursorPage> {
    const url = this.buildUrl(client, endpoint, cursor);

    logInfo(`Cursor fetch: ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        accept: 'gzip, deflate, br',
        'User-Agent': 'esiJS/2.0.0',
        'X-Compatibility-Date': '2025-12-16',
        ...(requiresAuth
          ? { Authorization: client.getAuthorizationHeader() }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data: unknown[];
    try {
      const parsed: unknown = await response.json();
      data = Array.isArray(parsed) ? (parsed as unknown[]) : [parsed];
    } catch (jsonError) {
      throw new Error(
        `Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
      );
    }

    const cursors = this.extractCursors(response.headers);

    return { data, cursors };
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
  ): Promise<unknown[]> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const rateLimiter = RateLimiter.getInstance();
    const allData: unknown[] = [...firstPageData];

    let afterToken = firstCursors.after;
    let pageCount = 1;
    let consecutiveFailures = 0;

    while (afterToken && pageCount < opts.maxPages) {
      try {
        await rateLimiter.checkRateLimit();

        const page = await this.fetchPageWithRetry(
          client,
          endpoint,
          method,
          requiresAuth,
          { after: afterToken },
          body,
          opts,
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
   */
  private static async fetchPageWithRetry(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    cursor: { before?: string; after?: string },
    body: unknown,
    options: Required<CursorPaginationOptions>,
  ): Promise<CursorPage> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await this.fetchPage(
          client,
          endpoint,
          method,
          requiresAuth,
          cursor,
          body,
        );
      } catch (error) {
        lastError = error as Error;
        logWarn(
          `Cursor fetch attempt ${attempt}/${options.maxRetries} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        if (attempt < options.maxRetries) {
          await this.sleep(options.retryDelayMs * attempt);
        }
      }
    }

    throw lastError || new Error('Cursor page fetch failed after all retries');
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
   * Build a URL with cursor query parameters appended.
   */
  private static buildUrl(
    client: ApiClient,
    endpoint: string,
    cursor?: { before?: string; after?: string },
  ): string {
    let url = `${client.getLink()}/${endpoint}`;
    if (!cursor) return url;

    const parts: string[] = [];
    if (cursor.before)
      parts.push(`before=${encodeURIComponent(cursor.before)}`);
    if (cursor.after) parts.push(`after=${encodeURIComponent(cursor.after)}`);

    if (parts.length > 0) {
      const separator = url.includes('?') ? '&' : '?';
      url += separator + parts.join('&');
    }
    return url;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
