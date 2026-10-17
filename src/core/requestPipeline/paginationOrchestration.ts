import { ApiClient } from '../ApiClient';
import { EsiError, EsiPaginationError } from '../util/error';
import { logInfo, logWarn } from '../logger/clientLog';
import { ParsedHeaders } from '../util/headersUtil';
import {
  PaginationHandler,
  PageFetcher,
} from '../pagination/PaginationHandler';
import { CursorTokens } from '../pagination/CursorPaginationHandler';
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
 * Handle offset-based pagination. Fetches remaining pages if xPages > 1. A
 * failed page rejects; a count above the page limit or an empty page after
 * the first follows the client's `incompletePages` mode, truncating with a
 * warning by default and rejecting under `throw` (DES-08). An `EsiError`,
 * EsiPaginationError included, is rethrown as it is; anything else is
 * wrapped in an EsiPaginationError with reason `fetch-failed`.
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
  sentAtWriteGeneration?: number,
  authorization?: string,
): Promise<EsiHandlerResponse> {
  const totalPages = parsed.xPages;

  if (totalPages <= 1) {
    return { headers: parsed.raw, body: data, status: 200 };
  }

  logInfo(
    client,
    `Found ${totalPages} pages, fetching additional pages with rate limiting...`,
    { endpoint, totalPages },
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
      { where: url },
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
      requiresAuth,
      sentAtWriteGeneration,
      authorization,
    );
    return { headers: parsed.raw, body: allData, status: 200 };
  } catch (paginationError: unknown) {
    const msg =
      paginationError instanceof Error
        ? paginationError.message
        : String(paginationError);
    logWarn(client, `Pagination failed for ${url}: ${msg}`, {
      url,
      endpoint,
      error: msg,
    });
    if (paginationError instanceof EsiError) {
      throw paginationError;
    }
    throw new EsiPaginationError(url, paginationError, {
      endpoint,
      reportedPages: totalPages,
    });
  }
}
