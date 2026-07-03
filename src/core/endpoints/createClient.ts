import { ApiClient } from '../ApiClient';
import { handleRequest, EsiHandlerResponse } from '../ApiRequestHandler';
import { EndpointMap, EndpointArgs } from './EndpointDefinition';
import { CursorTokens } from '../pagination/CursorPaginationHandler';
import { EsiResponse, EsiResponseMeta } from '../../types/api-responses';
import { buildEndpointPath } from './buildEndpointPath';
import { parseWarning } from '../util/headersUtil';
import { logWarn } from '../logger/loggerUtil';
import { EsiValidationError } from '../util/error';

export interface CursorOptions {
  before?: string;
  after?: string;
}

export interface CursorResult<T = unknown> {
  data: T[];
  cursors: CursorTokens;
}

export interface CreateClientOptions {
  returnMetadata?: boolean;
}

type ClientMethods<T extends EndpointMap> = {
  [K in keyof T]: (...args: EndpointArgs<T[K]>) => Promise<unknown>;
};

export type WithMetadata<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<EsiResponse<R>>
    : T[K];
};

function buildMeta(response: EsiHandlerResponse): EsiResponseMeta {
  const meta: EsiResponseMeta = {
    headers: response.headers,
    fromCache: response.fromCache ?? false,
    stale: response.stale ?? false,
  };
  if (response.cacheHitType) meta.cacheHitType = response.cacheHitType;
  if (response.responseTimeMs !== undefined)
    meta.responseTimeMs = response.responseTimeMs;
  const w = parseWarning(response.headers['warning']);
  if (w) meta.warning = w;
  if (response.headers['x-esi-request-id'])
    meta.requestId = response.headers['x-esi-request-id'];
  if (response.headers['date']) meta.date = response.headers['date'];
  if (response.headers['content-language'])
    meta.contentLanguage = response.headers['content-language'];
  if (response.headers['x-ratelimit-remaining']) {
    meta.rateLimit = {
      remaining: parseInt(response.headers['x-ratelimit-remaining'], 10),
      limit: parseInt(response.headers['x-ratelimit-limit'] ?? '0', 10),
      used: parseInt(response.headers['x-ratelimit-used'] ?? '0', 10),
      group: response.headers['x-ratelimit-group'] ?? null,
    };
  }
  return meta;
}

/* eslint-disable sonarjs/cognitive-complexity */
export function createClient<T extends EndpointMap>(
  apiClient: ApiClient,
  endpoints: T,
  options?: CreateClientOptions,
): ClientMethods<T> {
  const client = {} as ClientMethods<T>;
  const returnMetadata = options?.returnMetadata ?? false;

  for (const [methodName, def] of Object.entries(endpoints)) {
    // eslint-disable-next-line security/detect-object-injection
    (client as Record<string, (...args: unknown[]) => Promise<unknown>>)[
      methodName
    ] = async (...args: unknown[]) => {
      if (def.deprecated) {
        const parts = [`Endpoint '${methodName}' is deprecated.`];
        if (def.deprecated.message) parts.push(def.deprecated.message);
        if (def.deprecated.replacedBy)
          parts.push(`Use '${def.deprecated.replacedBy}' instead.`);
        if (def.deprecated.sunsetDate)
          parts.push(`Sunset date: ${def.deprecated.sunsetDate}.`);
        logWarn(parts.join(' '));
      }

      const built = buildEndpointPath(def, args, apiClient.getDatasource());
      let path = built.path;
      const body = built.body;

      if (def.cursorPagination) {
        const lastArg = args[args.length - 1];
        const isCursorArg =
          lastArg != null &&
          typeof lastArg === 'object' &&
          ('before' in lastArg || 'after' in lastArg);
        const cursorOpts: CursorOptions | undefined = isCursorArg
          ? (lastArg as CursorOptions)
          : undefined;

        if (cursorOpts) {
          const parts: string[] = [];
          if (cursorOpts.before)
            parts.push(`before=${encodeURIComponent(cursorOpts.before)}`);
          if (cursorOpts.after)
            parts.push(`after=${encodeURIComponent(cursorOpts.after)}`);
          if (parts.length > 0) {
            path += (path.includes('?') ? '&' : '?') + parts.join('&');
          }
        }

        const response = await handleRequest(
          apiClient,
          path,
          def.method,
          body,
          def.requiresAuth,
          true,
          def.path,
        );
        const responseBody = response.body;
        let data: unknown[];
        if (Array.isArray(responseBody)) {
          data = responseBody as unknown[];
        } else if (responseBody !== null && responseBody !== undefined) {
          data = [responseBody];
        } else {
          data = [];
        }
        const cursorResult: CursorResult = {
          data,
          cursors: response.cursors ?? { before: null, after: null },
        };

        if (returnMetadata) {
          return { data: cursorResult, meta: buildMeta(response) };
        }
        return cursorResult;
      }

      const response = await handleRequest(
        apiClient,
        path,
        def.method,
        body,
        def.requiresAuth,
        true,
        def.path,
      );
      let responseBody = response.body;
      if (def.responseSchema && apiClient.getValidateResponse()) {
        const result = def.responseSchema.safeParse(responseBody);
        if (!result.success) {
          throw new EsiValidationError(
            `${apiClient.getLink()}/${path}`,
            result.error,
          );
        }
        responseBody = result.data;
      }
      if (returnMetadata) {
        return { data: responseBody, meta: buildMeta(response) };
      }
      return responseBody;
    };
  }

  return client;
}
/* eslint-enable sonarjs/cognitive-complexity */

/**
 * Fetch all pages of a cursor-paginated endpoint.
 *
 * ESI returns cursor tokens in the response body. This helper follows
 * `after` tokens until the dataset is exhausted (empty items array).
 *
 * Usage with body-based cursors (ESI's actual format):
 *   const allJobs = await fetchAllCursorPages(
 *       (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
 *       (response) => response.freelance_jobs,
 *       (response) => response.cursor,
 *   );
 *
 * Usage with CursorResult shape:
 *   const all = await fetchAllCursorPages(
 *       (before, after) => fetcher({ before, after }),
 *       (r) => r.data,
 *       (r) => r.cursors,
 *   );
 */
export async function fetchAllCursorPages<TResponse, TItem = unknown>(
  fetcher: (before?: string, after?: string) => Promise<TResponse>,
  getItems: (response: TResponse) => TItem[],
  getCursor: (response: TResponse) => {
    before?: string | null;
    after?: string | null;
  },
): Promise<TItem[]> {
  const allData: TItem[] = [];
  let afterToken: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const response = await fetcher(undefined, afterToken);
    const items = getItems(response);

    if (!items || items.length === 0) {
      hasMore = false;
      continue;
    }

    allData.push(...items);

    const cursor = getCursor(response);
    if (!cursor.after) {
      hasMore = false;
      continue;
    }

    afterToken = cursor.after;
  }

  return allData;
}
