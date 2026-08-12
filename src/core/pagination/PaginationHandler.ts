/**
 * Pagination Handler for ESI API calls
 * Handles pagination with proper error handling and empty page detection
 */

import { ApiClient } from '../ApiClient';
import { logInfo, logWarn, logError } from '../logger/loggerUtil';
import { resolveRetryStrategy } from '../requestPipeline/dependencies';

export interface PaginationOptions {
  maxPages?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  stopOnEmptyPage?: boolean;
}

export type PageFetcher = (paginatedEndpoint: string) => Promise<unknown[]>;

export class PaginationHandler {
  private static readonly DEFAULT_OPTIONS: Required<PaginationOptions> = {
    maxPages: 1000, // Reasonable limit to prevent infinite loops
    maxRetries: 3,
    retryDelayMs: 1000,
    stopOnEmptyPage: true,
  };

  /**
   * Fetch remaining pages (2..totalPages) and combine with first page data.
   * The caller has already fetched page 1 and knows the total page count.
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
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const rateLimiter = client.getRateLimiter();
    const allData: unknown[] = [...firstPageData];

    const effectiveMaxPage = Math.min(totalPages, opts.maxPages);

    if (effectiveMaxPage <= 1) {
      return allData;
    }

    logInfo(`Fetching pages 2-${effectiveMaxPage} for ${endpoint}...`);

    for (let page = 2; page <= effectiveMaxPage; page++) {
      try {
        if (rateLimiter) await rateLimiter.checkRateLimit(templatePath, method);

        const pageData = await this.fetchPageWithRetry(
          client,
          endpoint,
          method,
          page,
          pageFetch,
        );

        if (opts.stopOnEmptyPage && (!pageData || pageData.length === 0)) {
          logWarn(`Page ${page} is empty. Stopping pagination.`);
          break;
        }

        allData.push(...pageData);
        logInfo(
          `Fetched page ${page}/${effectiveMaxPage} (${pageData.length} items)`,
        );
      } catch (error) {
        logError(
          `Failed to fetch page ${page}: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error instanceof Error
          ? error
          : new Error(`Failed to fetch page ${page}: ${String(error)}`);
      }
    }

    logInfo(
      `Pagination complete. Fetched ${allData.length} total items from up to ${effectiveMaxPage} pages.`,
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
    page: number,
    pageFetch: PageFetcher,
  ): Promise<unknown[]> {
    const retryStrategy = resolveRetryStrategy(client);
    const paginatedEndpoint = this.buildPaginatedEndpoint(endpoint, page);

    return retryStrategy.execute(
      () => {
        logInfo(`Fetching page ${page} via pipeline: ${paginatedEndpoint}`);
        return pageFetch(paginatedEndpoint);
      },
      {
        endpoint: paginatedEndpoint,
        method,
        requiresAuth: false,
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
