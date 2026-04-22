import { ApiClient } from '../ApiClient';
import { handleRequest, EsiHandlerResponse } from '../ApiRequestHandler';
import { EndpointMap, EndpointArgs } from './EndpointDefinition';
import { CursorTokens } from '../pagination/CursorPaginationHandler';
import { EsiResponse, EsiResponseMeta } from '../../types/api-responses';

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
  return {
    headers: response.headers,
    fromCache: response.fromCache ?? false,
    stale: response.stale ?? false,
  };
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
      let argIndex = 0;

      let path = def.path;
      if (def.pathParams) {
        for (const param of def.pathParams) {
          path = path.replace(`{${param}}`, String(args[argIndex++]));
        }
      }

      if (def.queryParams) {
        const queryParts: string[] = [];
        for (const [, queryKey] of Object.entries(def.queryParams)) {
          const value = args[argIndex++];
          if (value !== undefined) {
            queryParts.push(`${queryKey}=${encodeURIComponent(String(value))}`);
          }
        }
        if (queryParts.length > 0) {
          path += (path.includes('?') ? '&' : '?') + queryParts.join('&');
        }
      }

      let body: unknown = undefined;
      if (def.bodyBuilder) {
        /* eslint-disable @typescript-eslint/no-unsafe-argument */
        body = def.bodyBuilder(
          ...(args.slice(argIndex) as Parameters<typeof def.bodyBuilder>),
        );
        /* eslint-enable @typescript-eslint/no-unsafe-argument */
      } else if (def.hasBody) {
        // eslint-disable-next-line security/detect-object-injection
        body = args[argIndex];
      }

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
      );
      if (returnMetadata) {
        return { data: response.body, meta: buildMeta(response) };
      }
      return response.body;
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
