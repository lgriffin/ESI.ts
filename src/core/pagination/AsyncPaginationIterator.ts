import { ApiClient } from '../ApiClient';
import { handleSinglePageRequest } from '../ApiRequestHandler';
import { logInfo } from '../logger/clientLog';
import { EsiPaginationError, EsiValidationError } from '../util/error';
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

/**
 * The page count page 1 reported, from its X-Pages header. An unreadable or
 * absent count is one page. A count above MAX_PAGES throws `page-cap` before
 * any further page is requested (security model P8, DES-08).
 */
function reportedPageCount(
  client: ApiClient,
  endpoint: string,
  header: string | undefined,
  firstPage: unknown[],
): number {
  const reported = parseInt(header || '1', 10);
  if (reported > MAX_PAGES) {
    throw new EsiPaginationError(`${client.getLink()}/${endpoint}`, undefined, {
      reason: 'page-cap',
      endpoint,
      reportedPages: reported,
      fetchedPages: 1,
      partial: firstPage,
    });
  }
  return boundedPageCount(reported);
}

/** A page after the first came back empty: the collection shrank mid-walk. */
function emptyPage(
  client: ApiClient,
  endpoint: string,
  page: number,
  totalPages: number,
  partial: unknown[],
  itemCount: number = partial.length,
): EsiPaginationError {
  return new EsiPaginationError(`${client.getLink()}/${endpoint}`, undefined, {
    reason: 'empty-page',
    endpoint,
    reportedPages: totalPages,
    fetchedPages: page,
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
  const totalPages = reportedPageCount(
    client,
    endpoint,
    firstResponse.headers['x-pages'],
    result,
  );

  // Empty for one page (or an unreadable X-Pages, which counts as 1), so the
  // loop below does nothing and the first page is the whole result.
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

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
    // first empty page even when later pages of the wave carried items.
    for (const { page, data } of pages) {
      if (data.length === 0) {
        throw emptyPage(client, endpoint, page, totalPages, result);
      }
      result.push(...data);
    }
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
): AsyncGenerator<PageResult<T>, void, undefined> {
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

  const firstData = extractArray<T>(firstBody);
  const totalPages = reportedPageCount(
    client,
    endpoint,
    firstResponse.headers['x-pages'],
    firstData,
  );

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
    );

    const pageBody = validatePageBody(
      response.body,
      responseSchema,
      `${client.getLink()}/${pagedEndpoint}`,
      validate,
    );
    const pageData = extractArray<T>(pageBody);
    if (pageData.length === 0) {
      throw emptyPage(client, endpoint, page, totalPages, [], yieldedItems);
    }

    yield { data: pageData, page, totalPages };
    yieldedItems += pageData.length;
  }
}
