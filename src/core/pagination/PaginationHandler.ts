/**
 * Pagination Handler for ESI API calls
 * Handles pagination with proper error handling and empty page detection
 */

import { ApiClient } from '../ApiClient';
import { logInfo, logWarn, logError } from '../logger/loggerUtil';
import { sleep } from '../util/sleep';

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

    let consecutiveFailures = 0;

    for (let page = 2; page <= effectiveMaxPage; page++) {
      try {
        if (rateLimiter) await rateLimiter.checkRateLimit(templatePath, method);

        const pageData = await this.fetchPageWithRetry(
          endpoint,
          page,
          opts,
          pageFetch,
        );

        consecutiveFailures = 0;

        if (opts.stopOnEmptyPage && (!pageData || pageData.length === 0)) {
          logWarn(`Page ${page} is empty. Stopping pagination.`);
          break;
        }

        allData.push(...pageData);
        logInfo(
          `Fetched page ${page}/${effectiveMaxPage} (${pageData.length} items)`,
        );
      } catch (error) {
        consecutiveFailures++;
        logError(
          `Failed to fetch page ${page}: ${error instanceof Error ? error.message : String(error)}`,
        );

        if (consecutiveFailures >= opts.maxRetries) {
          logWarn(
            `${consecutiveFailures} consecutive failures. Stopping pagination.`,
          );
          break;
        }
      }
    }

    logInfo(
      `Pagination complete. Fetched ${allData.length} total items from up to ${effectiveMaxPage} pages.`,
    );
    return allData;
  }

  /**
   * Fetch a single page with retry logic
   */
  private static async fetchPageWithRetry(
    endpoint: string,
    page: number,
    options: Required<PaginationOptions>,
    pageFetch: PageFetcher,
  ): Promise<unknown[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await this.fetchSinglePage(endpoint, page, pageFetch);
      } catch (error) {
        lastError = error as Error;
        logWarn(
          `Attempt ${attempt}/${options.maxRetries} failed for page ${page}: ${error instanceof Error ? error.message : String(error)}`,
        );

        if (attempt < options.maxRetries) {
          await sleep(options.retryDelayMs * attempt);
        }
      }
    }

    throw (
      lastError ||
      new Error(
        `Failed to fetch page ${page} after ${options.maxRetries} attempts`,
      )
    );
  }

  /**
   * Fetch a single page.
   * Preserves any existing query params on the endpoint and appends page=N.
   */
  private static async fetchSinglePage(
    endpoint: string,
    page: number,
    pageFetch: PageFetcher,
  ): Promise<unknown[]> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const paginatedEndpoint = `${endpoint}${separator}page=${page}`;

    logInfo(`Fetching page ${page} via pipeline: ${paginatedEndpoint}`);
    return pageFetch(paginatedEndpoint);
  }
}
