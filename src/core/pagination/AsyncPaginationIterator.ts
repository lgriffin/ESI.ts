import { ApiClient } from '../ApiClient';
import { handleSinglePageRequest } from '../ApiRequestHandler';
import { logInfo } from '../logger/clientLog';
import { EsiValidationError } from '../util/error';
import { incompleteWalk } from './incompleteWalk';
import { MAX_PAGES, boundedPageCount } from './pageLimit';
import type { EndpointDefinition } from '../endpoints/EndpointDefinition';

export interface PageResult<T = unknown> {
  data: T[];
  page: number;
  totalPages: number;
}

type ResponseSchema = NonNullable<EndpointDefinition['responseSchema']>;

function extractArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body !== undefined && body !== null) return [body as T];
  return [];
}

interface PageCount {
  /** What page 1's X-Pages said; NaN when absent or unreadable. */
  readonly reported: number;
  /** The pages this walk requests: the reported count, bounded. */
  readonly totalPages: number;
}

/**
 * The page count page 1 reported, from its X-Pages header. An unreadable or
 * absent count is one page. A count above MAX_PAGES is walked as far as
 * MAX_PAGES (security model P8); under `incompletePages: 'throw'` it rejects
 * with `page-cap` here, before any further page is requested (DES-08).
 */
function pageCount(
  client: ApiClient,
  endpoint: string,
  header: string | undefined,
  firstPage: unknown[],
): PageCount {
  const reported = parseInt(header || '1', 10);
  if (reported > MAX_PAGES && client.getIncompletePages() === 'throw') {
    incompleteWalk(client, `${client.getLink()}/${endpoint}`, {
      reason: 'page-cap',
      endpoint,
      reportedPages: reported,
      fetchedPages: 1,
      partial: firstPage,
    });
  }
  return { reported, totalPages: boundedPageCount(reported) };
}

/**
 * A walk that stopped short of what page 1 reported (`reportedPages` is that
 * count, uncapped, for either reason): throws under
 * `incompletePages: 'throw'`, otherwise warns and returns.
 */
function stopShort(
  client: ApiClient,
  endpoint: string,
  reason: 'page-cap' | 'empty-page',
  count: PageCount,
  fetchedPages: number,
  partial: unknown[],
  itemCount: number = partial.length,
): void {
  incompleteWalk(client, `${client.getLink()}/${endpoint}`, {
    reason,
    endpoint,
    // What page 1's X-Pages said, as the eager path reports it; an
    // unreadable count falls back to the pages walked.
    reportedPages: Number.isFinite(count.reported)
      ? count.reported
      : count.totalPages,
    fetchedPages,
    partial,
    itemCount,
  });
}

function validatePageBody(
  body: unknown,
  schema: ResponseSchema | undefined,
  url: string,
  validate: boolean,
): unknown {
  if (!schema || !validate) return body;
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new EsiValidationError(url, result.error);
  }
  return result.data;
}

export async function fetchAllPages<T = unknown>(
  client: ApiClient,
  endpoint: string,
  method: string,
  requiresAuth: boolean = false,
  body?: unknown,
  templatePath?: string,
  responseSchema?: ResponseSchema,
  concurrency: number = 8,
): Promise<T[]> {
  const validate = client.getValidateResponse();
  const firstResponse = await handleSinglePageRequest(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
    templatePath,
  );

  const firstBody = validatePageBody(
    firstResponse.body,
    responseSchema,
    `${client.getLink()}/${endpoint}`,
    validate,
  );

  const result: T[] = extractArray<T>(firstBody);
  const count = pageCount(
    client,
    endpoint,
    firstResponse.headers['x-pages'],
    result,
  );
  const { totalPages } = count;

  // Empty for one page (or an unreadable X-Pages, which counts as 1), so the
  // loop below does nothing and the first page is the whole result.
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  let emptySeen = false;

  // Stryker disable next-line EqualityOperator: `<=` adds one pass over an empty slice, which fetches nothing and pushes nothing.
  for (let i = 0; i < remaining.length; i += concurrency) {
    const batch = remaining.slice(i, i + concurrency);
    const pages = await Promise.all(
      batch.map(async (page) => {
        const sep = endpoint.includes('?') ? '&' : '?';
        const pagedEndpoint = `${endpoint}${sep}page=${page}`;

        logInfo(
          client,
          `Fetching page ${page}/${totalPages}: ${pagedEndpoint}`,
          { page, totalPages },
        );

        const response = await handleSinglePageRequest(
          client,
          pagedEndpoint,
          method,
          body,
          requiresAuth,
          templatePath,
        );

        const pageBody = validatePageBody(
          response.body,
          responseSchema,
          `${client.getLink()}/${pagedEndpoint}`,
          validate,
        );
        return { page, data: extractArray<T>(pageBody) };
      }),
    );

    // Pages are checked in page order, so `partial` is the prefix before the
    // first empty page even when later pages of the wave carried items. In
    // `truncate` mode the walk warns once and goes on collecting, as it did
    // before `incompletePages` existed.
    for (const { page, data } of pages) {
      if (data.length === 0 && !emptySeen) {
        emptySeen = true;
        stopShort(client, endpoint, 'empty-page', count, page, result);
      }
      result.push(...data);
    }
  }

  if (count.reported > totalPages) {
    stopShort(client, endpoint, 'page-cap', count, totalPages, result);
  }
  return result;
}

export async function* fetchPages<T = unknown>(
  client: ApiClient,
  endpoint: string,
  method: string,
  requiresAuth: boolean = false,
  body?: unknown,
  templatePath?: string,
  responseSchema?: ResponseSchema,
  emptyWhenNoContent: boolean = false,
): AsyncGenerator<PageResult<T>, void, undefined> {
  const validate = client.getValidateResponse();
  const firstResponse = await handleSinglePageRequest(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
    templatePath,
    undefined,
    emptyWhenNoContent,
  );

  const firstBody = validatePageBody(
    firstResponse.body,
    responseSchema,
    `${client.getLink()}/${endpoint}`,
    validate,
  );

  const firstData = extractArray<T>(firstBody);
  const count = pageCount(
    client,
    endpoint,
    firstResponse.headers['x-pages'],
    firstData,
  );
  const { totalPages } = count;

  yield { data: firstData, page: 1, totalPages };
  // Yielded pages are the consumer's already, so an error counts their items
  // rather than holding them: a stream keeps one page in memory.
  let yieldedItems = firstData.length;

  for (let page = 2; page <= totalPages; page++) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const pagedEndpoint = `${endpoint}${sep}page=${page}`;

    logInfo(client, `Fetching page ${page}/${totalPages}: ${pagedEndpoint}`, {
      page,
      totalPages,
    });

    const response = await handleSinglePageRequest(
      client,
      pagedEndpoint,
      method,
      body,
      requiresAuth,
      templatePath,
      undefined,
      emptyWhenNoContent,
    );

    const pageBody = validatePageBody(
      response.body,
      responseSchema,
      `${client.getLink()}/${pagedEndpoint}`,
      validate,
    );
    const pageData = extractArray<T>(pageBody);
    if (pageData.length === 0) {
      stopShort(client, endpoint, 'empty-page', count, page, [], yieldedItems);
      return;
    }

    yield { data: pageData, page, totalPages };
    yieldedItems += pageData.length;
  }

  if (count.reported > totalPages) {
    stopShort(
      client,
      endpoint,
      'page-cap',
      count,
      totalPages,
      [],
      yieldedItems,
    );
  }
}
