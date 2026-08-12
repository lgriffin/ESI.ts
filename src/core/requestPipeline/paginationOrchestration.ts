import { ApiClient } from '../ApiClient';
import { buildError, EsiError } from '../util/error';
import { logInfo, logWarn } from '../logger/loggerUtil';
import { ParsedHeaders } from '../util/headersUtil';
import {
  PaginationHandler,
  PageFetcher,
} from '../pagination/PaginationHandler';
import { CursorTokens } from '../pagination/CursorPaginationHandler';
import { CircuitOpenError } from '../circuitBreaker/CircuitBreaker';
import { ICache } from '../cache/ICache';
import { cacheResponse, EsiHandlerResponse } from './cachePolicy';

/**
 * Handle cursor-based pagination. Returns null if the response
 * does not contain cursor pagination headers.
 */
export function handleCursorPagination(
  parsed: ParsedHeaders,
  data: unknown,
): EsiHandlerResponse | null {
  if (!parsed.hasCursorPagination) return null;

  const cursors: CursorTokens = {
    before: parsed.cursorBefore,
    after: parsed.cursorAfter,
  };

  return { headers: parsed.raw, body: data, status: 200, cursors };
}

/**
 * Handle offset-based pagination. Fetches remaining pages if xPages > 1.
 */
export async function handleOffsetPagination(
  client: ApiClient,
  endpoint: string,
  method: string,
  requiresAuth: boolean,
  parsed: ParsedHeaders,
  data: unknown,
  body: unknown,
  url: string,
  useETag: boolean,
  pageFetch: PageFetcher,
  resolveCache: (client: ApiClient) => ICache | null,
  templatePath?: string,
): Promise<EsiHandlerResponse> {
  const totalPages = parsed.xPages;

  if (totalPages <= 1) {
    return { headers: parsed.raw, body: data, status: 200 };
  }

  logInfo(
    `Found ${totalPages} pages, fetching additional pages with rate limiting...`,
  );

  try {
    const firstPageData = Array.isArray(data) ? data : [data];
    const allData = await PaginationHandler.fetchRemainingPages(
      client,
      endpoint,
      method,
      requiresAuth,
      firstPageData,
      totalPages,
      body,
      {
        maxPages: Math.min(totalPages, 1000),
        stopOnEmptyPage: true,
        maxRetries: 3,
      },
      pageFetch,
      templatePath,
    );

    cacheResponse(
      client,
      url,
      method,
      endpoint,
      parsed,
      allData,
      useETag,
      resolveCache,
      templatePath,
    );
    return { headers: parsed.raw, body: allData, status: 200 };
  } catch (paginationError: unknown) {
    const msg =
      paginationError instanceof Error
        ? paginationError.message
        : String(paginationError);
    logWarn(`Pagination failed for ${url}: ${msg}`);
    if (
      paginationError instanceof EsiError ||
      paginationError instanceof CircuitOpenError
    ) {
      throw paginationError;
    }
    throw buildError(
      `Pagination incomplete for ${url}: ${msg}`,
      'PAGINATION_INCOMPLETE',
      url,
    );
  }
}
