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
        stopOnEmptyPage: true
    };

    /**
     * Fetch all pages for a given endpoint
     */
    static async fetchAllPages(
        client: ApiClient,
        baseEndpoint: string,
        method: string,
        requiresAuth: boolean,
        body?: any,
        options: PaginationOptions = {}
    ): Promise<any[]> {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };
        const rateLimiter = RateLimiter.getInstance();
        const allData: any[] = [];

        try {
            // Fetch first page to get total pages info
            const firstPageData = await this.fetchPageWithRetry(
                client, baseEndpoint, method, 1, requiresAuth, body, opts
            );
            
            allData.push(...firstPageData.data);
            const totalPages = firstPageData.totalPages;

            logInfo(`Found ${totalPages} total pages. Fetching remaining pages...`);

            // If only one page, return early
            if (totalPages <= 1) {
                return allData;
            }

            // Fetch remaining pages with rate limiting
            for (let page = 2; page <= totalPages && page <= opts.maxPages; page++) {
                try {
                    // Check rate limit before each request
                    await rateLimiter.checkRateLimit();

                    const pageData = await this.fetchPageWithRetry(
                        client, baseEndpoint, method, page, requiresAuth, body, opts
                    );

                    // Check if page is empty and we should stop
                    if (opts.stopOnEmptyPage && (!pageData.data || pageData.data.length === 0)) {
                        logWarn(`Page ${page} is empty. Stopping pagination.`);
                        break;
                    }

                    allData.push(...pageData.data);
                    logInfo(`Fetched page ${page}/${totalPages} (${pageData.data?.length || 0} items)`);

                } catch (error) {
                    logError(`Failed to fetch page ${page}: ${error}`);
                    
                    // If we've hit max retries, stop pagination
                    if (page > opts.maxRetries) {
                        logWarn(`Max retries reached for page ${page}. Stopping pagination.`);
                        break;
                    }
                    
                    // Wait before retrying
                    await this.sleep(opts.retryDelayMs);
                }
            }

            logInfo(`Pagination complete. Fetched ${allData.length} total items from ${Math.min(totalPages, opts.maxPages)} pages.`);
            return allData;

        } catch (error) {
            logError(`Pagination failed: ${error}`);
            throw buildError(`Pagination failed: ${error}`, 'PAGINATION_ERROR');
        }
    }

    /**
     * Fetch a single page with retry logic
     */
    private static async fetchPageWithRetry(
        client: ApiClient,
        baseEndpoint: string,
        method: string,
        page: number,
        requiresAuth: boolean,
        body: any,
        options: Required<PaginationOptions>
    ): Promise<{ data: any[], totalPages: number }> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
            try {
                const response = await this.fetchSinglePage(
                    client, baseEndpoint, method, page, requiresAuth, body
                );

                return {
                    data: response.data || [],
                    totalPages: response.totalPages || 1
                };

            } catch (error) {
                lastError = error as Error;
                logWarn(`Attempt ${attempt}/${options.maxRetries} failed for page ${page}: ${error}`);

                if (attempt < options.maxRetries) {
                    await this.sleep(options.retryDelayMs * attempt); // Exponential backoff
                }
            }
        }

        throw lastError || new Error(`Failed to fetch page ${page} after ${options.maxRetries} attempts`);
    }

    /**
     * Fetch a single page
     */
    private static async fetchSinglePage(
        client: ApiClient,
        baseEndpoint: string,
        method: string,
        page: number,
        requiresAuth: boolean,
        body: any
    ): Promise<{ data: any[], totalPages: number }> {
        const paginatedEndpoint = `${baseEndpoint}?page=${page}`;
        const url = `${client.getLink()}/${paginatedEndpoint}`;

        logInfo(`Fetching page ${page}: ${url}`);

        const response = await fetch(url, {
            method,
            headers: {
                accept: 'gzip, deflate, br',
                'User-Agent': 'esiJS/2.0.0',
                ...(requiresAuth ? { Authorization: client.getAuthorizationHeader() } : {})
            },
            body: body ? JSON.stringify(body) : undefined
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
        const totalPages = parseInt(response.headers.get('x-pages') || '1', 10);

        return { data, totalPages };
    }

    /**
     * Sleep utility
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
