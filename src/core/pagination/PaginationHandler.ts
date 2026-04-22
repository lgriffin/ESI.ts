/**
 * Pagination Handler for ESI API calls
 * Handles pagination with proper error handling and empty page detection
 */

import { ApiClient } from '../ApiClient';
import { logInfo, logWarn, logError } from '../logger/loggerUtil';
import { buildError } from '../util/error';
import { RateLimiter } from '../rateLimiter/RateLimiter';

export interface PaginationOptions {
  maxPages?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  stopOnEmptyPage?: boolean;
}

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
    firstPageData: any[],
    totalPages: number,
    body?: any,
    options: PaginationOptions = {},
  ): Promise<any[]> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const rateLimiter = RateLimiter.getInstance();
    const allData: any[] = [...firstPageData];

    const effectiveMaxPage = Math.min(totalPages, opts.maxPages);

    if (effectiveMaxPage <= 1) {
      return allData;
    }

    logInfo(`Fetching pages 2-${effectiveMaxPage} for ${endpoint}...`);

    let consecutiveFailures = 0;

    for (let page = 2; page <= effectiveMaxPage; page++) {
      try {
        await rateLimiter.checkRateLimit();

        const pageData = await this.fetchPageWithRetry(
          client,
          endpoint,
          method,
          page,
          requiresAuth,
          body,
          opts,
        );

        consecutiveFailures = 0;

        if (opts.stopOnEmptyPage && (!pageData || pageData.length === 0)) {
          logWarn(`Page ${page} is empty. Stopping pagination.`);
          break;
        }

        allData.push(...pageData);
        logInfo(
          `Fetched page ${page}/${effectiveMaxPage} (${pageData?.length || 0} items)`,
        );
      } catch (error) {
        consecutiveFailures++;
        logError(`Failed to fetch page ${page}: ${error}`);

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
    client: ApiClient,
    endpoint: string,
    method: string,
    page: number,
    requiresAuth: boolean,
    body: any,
    options: Required<PaginationOptions>,
  ): Promise<any[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      try {
        return await this.fetchSinglePage(
          client,
          endpoint,
          method,
          page,
          requiresAuth,
          body,
        );
      } catch (error) {
        lastError = error as Error;
        logWarn(
          `Attempt ${attempt}/${options.maxRetries} failed for page ${page}: ${error}`,
        );

        if (attempt < options.maxRetries) {
          await this.sleep(options.retryDelayMs * attempt);
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
    client: ApiClient,
    endpoint: string,
    method: string,
    page: number,
    requiresAuth: boolean,
    body: any,
  ): Promise<any[]> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const paginatedEndpoint = `${endpoint}${separator}page=${page}`;
    const url = `${client.getLink()}/${paginatedEndpoint}`;

    logInfo(`Fetching page ${page}: ${url}`);

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

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error(`Invalid JSON response for page ${page}: ${jsonError}`);
    }

    return Array.isArray(data) ? data : [data];
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
