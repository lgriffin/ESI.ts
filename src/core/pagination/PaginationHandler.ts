/**
 * Pagination Handler for ESI API calls.
 *
 * Fetches pages 2..N of an offset-paginated resource. A page that fails with
 * a non-ESI error ends in an EsiPaginationError (`fetch-failed`). A walk that
 * cannot be proven complete, a reported page count above MAX_PAGES or an
 * empty page after the first, follows the client's `incompletePages` mode:
 * `truncate` (the default) returns the pages fetched so far with a warning,
 * `throw` rejects with an EsiPaginationError (DES-08).
 */

import { ApiClient } from '../ApiClient';
import { logInfo, logError } from '../logger/clientLog';
import { resolveRetryStrategy } from '../requestPipeline/dependencies';
import {
  EsiError,
  EsiPaginationError,
  type EsiPaginationErrorDetails,
  PaginationStopReason,
} from '../util/error';
import { incompleteWalk } from './incompleteWalk';
import { MAX_PAGES } from './pageLimit';

export interface PaginationOptions {
  /** The most pages one call requests. Default MAX_PAGES; never above it. */
  maxPages?: number;
  /** The URL an EsiPaginationError names. Default: the endpoint. */
  where?: string;
}

export type PageFetcher = (paginatedEndpoint: string) => Promise<unknown[]>;

/**
 * What a page that failed after its retries rejects the walk with: an
 * `EsiError` as it is, anything else as an EsiPaginationError with reason
 * `fetch-failed` (a thrown non-Error wrapped in an Error first, as before).
 */
function pageFailure(
  client: ApiClient,
  where: string,
  page: number,
  error: unknown,
  details: EsiPaginationErrorDetails,
): unknown {
  const text = error instanceof Error ? error.message : String(error);
  logError(client, `Failed to fetch page ${page}: ${text}`, { page });
  if (error instanceof EsiError) return error;
  return new EsiPaginationError(
    where,
    error instanceof Error
      ? error
      : new Error(`Failed to fetch page ${page}: ${text}`),
    { ...details, reason: 'fetch-failed', fetchedPages: page - 1 },
  );
}

export class PaginationHandler {
  /**
   * Fetch remaining pages (2..totalPages) and combine with first page data.
   * The caller has already fetched page 1 and knows the total page count.
   *
   * A page that fails with a non-ESI error throws EsiPaginationError with
   * reason `fetch-failed`; an `EsiError` from a page is rethrown unchanged.
   * With the client's `incompletePages` set to `throw`, it also throws
   * EsiPaginationError with reason `page-cap` (before any further request)
   * when totalPages is above the page limit, and `empty-page` when a page
   * after the first has no items. With the default, `truncate`, those two
   * stop the walk at the limit or at the empty page, log a warning and
   * resolve with the pages fetched.
   */
  static async fetchRemainingPages(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    firstPageData: unknown[],
    totalPages: number,
    body: unknown,
    options: PaginationOptions,
    pageFetch: PageFetcher,
    templatePath?: string,
  ): Promise<unknown[]> {
    const maxPages = Math.min(options.maxPages ?? MAX_PAGES, MAX_PAGES);
    const rateLimiter = client.getRateLimiter();
    const allData: unknown[] = [...firstPageData];
    const where = options.where ?? endpoint;

    const stop = (reason: PaginationStopReason, fetchedPages: number): void =>
      incompleteWalk(client, where, {
        reason,
        endpoint,
        reportedPages: totalPages,
        fetchedPages,
        partial: allData,
      });

    // `throw` mode rejects here, before page 2. `truncate` mode walks up to
    // the limit and warns when it gets there.
    if (totalPages > maxPages && client.getIncompletePages() === 'throw') {
      stop('page-cap', 1);
    }
    const lastPage = Math.min(totalPages, maxPages);

    if (lastPage > 1) {
      logInfo(client, `Fetching pages 2-${lastPage} for ${endpoint}...`, {
        method,
        totalPages,
      });
    }

    for (let page = 2; page <= lastPage; page++) {
      let pageData: unknown[];
      try {
        if (rateLimiter) await rateLimiter.checkRateLimit(templatePath, method);

        pageData = await this.fetchPageWithRetry(
          client,
          endpoint,
          method,
          requiresAuth,
          page,
          pageFetch,
        );
      } catch (error) {
        throw pageFailure(client, where, page, error, {
          endpoint,
          reportedPages: totalPages,
          partial: allData,
        });
      }

      // An empty page inside the reported count means the collection shrank
      // during the walk and items moved onto pages already read.
      if (!pageData || pageData.length === 0) {
        stop('empty-page', page);
        return allData;
      }

      allData.push(...pageData);
      logInfo(
        client,
        `Fetched page ${page}/${lastPage} (${pageData.length} items)`,
        { page, items: pageData.length },
      );
    }

    if (totalPages > lastPage) {
      stop('page-cap', Math.max(lastPage, 1));
    } else if (lastPage > 1) {
      logInfo(
        client,
        `Pagination complete. Fetched ${allData.length} total items from ${lastPage} pages.`,
        { totalItems: allData.length },
      );
    }
    return allData;
  }

  /**
   * Fetch a single page with retry logic.
   *
   * Delegates to the configured `IRetryStrategy` (exponential backoff
   * with jitter) instead of implementing a custom retry loop.
   */
  private static async fetchPageWithRetry(
    client: ApiClient,
    endpoint: string,
    method: string,
    requiresAuth: boolean,
    page: number,
    pageFetch: PageFetcher,
  ): Promise<unknown[]> {
    const retryStrategy = resolveRetryStrategy(client);
    const paginatedEndpoint = this.buildPaginatedEndpoint(endpoint, page);

    return retryStrategy.execute(
      () => {
        logInfo(
          client,
          `Fetching page ${page} via pipeline: ${paginatedEndpoint}`,
          { page },
        );
        return pageFetch(paginatedEndpoint);
      },
      {
        client,
        endpoint: paginatedEndpoint,
        method,
        requiresAuth,
        refreshToken: client.hasTokenProvider()
          ? () => client.refreshToken().then(() => {})
          : undefined,
      },
    );
  }

  /**
   * Build a paginated endpoint path.
   * Preserves any existing query params on the endpoint and appends page=N.
   */
  private static buildPaginatedEndpoint(
    endpoint: string,
    page: number,
  ): string {
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}page=${page}`;
  }
}
