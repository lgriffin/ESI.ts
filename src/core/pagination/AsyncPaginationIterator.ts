import { ApiClient } from '../ApiClient';
import { handleSinglePageRequest } from '../ApiRequestHandler';
import { logInfo } from '../logger/loggerUtil';

export interface PageResult<T = unknown> {
  data: T[];
  page: number;
  totalPages: number;
}

function extractArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body !== undefined && body !== null) return [body as T];
  return [];
}

export async function* fetchPages<T = unknown>(
  client: ApiClient,
  endpoint: string,
  method: string,
  requiresAuth: boolean = false,
  body?: unknown,
): AsyncGenerator<PageResult<T>, void, undefined> {
  const firstResponse = await handleSinglePageRequest(
    client,
    endpoint,
    method,
    body,
    requiresAuth,
  );

  const totalPages = parseInt(firstResponse.headers['x-pages'] || '1', 10);

  yield { data: extractArray<T>(firstResponse.body), page: 1, totalPages };

  for (let page = 2; page <= totalPages; page++) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const pagedEndpoint = `${endpoint}${sep}page=${page}`;

    logInfo(`Fetching page ${page}/${totalPages}: ${pagedEndpoint}`);

    const response = await handleSinglePageRequest(
      client,
      pagedEndpoint,
      method,
      body,
      requiresAuth,
    );

    const pageData = extractArray<T>(response.body);
    if (pageData.length === 0) break;

    yield { data: pageData, page, totalPages };
  }
}
