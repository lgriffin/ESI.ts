/**
 * Pagination Handler for ESI API calls.
 *
 * Fetches pages 2..N of an offset-paginated resource and either returns the
 * whole collection or throws: a reported page count above MAX_PAGES, an empty
 * page after the first, or a page that fails with a non-ESI error all end in
 * an EsiPaginationError rather than a short list (DES-08).
 */

import { ApiClient } from '../ApiClient';
import { logInfo, logError } from '../logger/clientLog';
import { resolveRetryStrategy } from '../requestPipeline/dependencies';
import {
  EsiError,
  EsiPaginationError,
  PaginationStopReason,
} from '../util/error';
import { MAX_PAGES } from './pageLimit';

export interface PaginationOptions {
  /** The most pages one call requests. Default MAX_PAGES; never above it. */
  maxPages?: number;
  /** The URL an EsiPaginationError names. Default: the endpoint. */
  where?: string;
}

export type PageFetcher = (paginatedEndpoint: string) => Promise<unknown[]>;

export class PaginationHandler {
  /**
   * Fetch remaining pages (2..totalPages) and combine with first page data.
   * The caller has already fetched page 1 and knows the total page count.
   *
   * Resolves only with every page page 1 reported. Throws EsiPaginationError
   * with reason `page-cap` (before any further request) when totalPages is
   * above the page limit, `empty-page` when a page after the first has no
   * items, and `fetch-failed` when a page fails with a non-ESI error. An
   * `EsiError` from a page is rethrown unchanged.
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

    const stop = (
      reason: PaginationStopReason,
      fetchedPages: number,
      cause?: unknown,
    ) =>
      new EsiPaginationError(options.where ?? endpoint, cause, {
        reason,
        endpoint,
        reportedPages: totalPages,
        fetchedPages,
        partial: allData,
      });

    if (totalPages > maxPages) {
      throw stop('page-cap', 1);
    }

    if (totalPages <= 1) {
      return allData;
    }

    logInfo(client, `Fetching pages 2-${totalPages} for ${endpoint}...`, {
      method,
      totalPages,
    });

    for (let page = 2; page <= totalPages; page++) {
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
        logError(
          client,
          `Failed to fetch page ${page}: ${error instanceof Error ? error.message : String(error)}`,
          { page },
        );
        if (error instanceof EsiError) throw error;
        throw stop('fetch-failed', page - 1, error);
      }

      // An empty page inside the reported count means the collection shrank
      // during the walk and items moved onto pages already read.
      if (!pageData || pageData.length === 0) {
        throw stop('empty-page', page);
      }

      allData.push(...pageData);
      logInfo(
        client,
        `Fetched page ${page}/${totalPages} (${pageData.length} items)`,
        { page, items: pageData.length },
      );
    }

    logInfo(
      client,
      `Pagination complete. Fetched ${allData.length} total items from ${totalPages} pages.`,
      { totalItems: allData.length },
    );
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
