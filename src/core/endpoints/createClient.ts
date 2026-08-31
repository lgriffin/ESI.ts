import { ApiClient } from '../ApiClient';
import { handleRequest, EsiHandlerResponse } from '../ApiRequestHandler';
import { EndpointMap, EndpointArgs } from './EndpointDefinition';
import { CursorTokens } from '../pagination/CursorPaginationHandler';
import {
  EsiResponse,
  EsiResult,
  EsiResponseMeta,
} from '../../types/api-responses';
import { buildEndpointPath } from './buildEndpointPath';
import { parseWarning } from '../util/headersUtil';
import { logWarn } from '../logger/loggerUtil';
import { EsiError, EsiValidationError } from '../util/error';
import type { z } from 'zod';

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
  safeMode?: boolean;
}

/** Extract the element type from an array type, or return T unchanged. */
export type UnwrapArray<T> = T extends readonly (infer E)[] ? E : T;

/**
 * Infer the result type from an endpoint definition's responseSchema.
 *
 * - When `cursorPagination: true`, wraps in `CursorResult<ElementType>`.
 * - When `responseSchema` is present, uses `z.infer` to extract the type.
 * - Falls back to `unknown` when no `responseSchema` is defined.
 */
export type InferEndpointResult<D> = D extends { cursorPagination: true }
  ? D extends { responseSchema: infer S extends z.ZodTypeAny }
    ? CursorResult<UnwrapArray<z.infer<S>>>
    : CursorResult
  : D extends { responseSchema: infer S extends z.ZodTypeAny }
    ? z.infer<S>
    : unknown;

type ClientMethods<T extends EndpointMap> = {
  [K in keyof T]: (
    ...args: EndpointArgs<T[K]>
  ) => Promise<InferEndpointResult<T[K]>>;
};

export type WithMetadata<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<EsiResponse<R>>
    : T[K];
};

export type WithSafeMode<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<EsiResult<R>>
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
  if (response.headers['etag']) meta.etag = response.headers['etag'];
  if (response.headers['x-pages'])
    meta.pages = parseInt(response.headers['x-pages'], 10);
  if (response.headers['expires']) meta.expires = response.headers['expires'];
  if (response.headers['x-esi-error-limit-remain'])
    meta.errorLimitRemain = parseInt(
      response.headers['x-esi-error-limit-remain'],
      10,
    );
  if (response.headers['x-esi-error-limit-reset'])
    meta.errorLimitReset = parseInt(
      response.headers['x-esi-error-limit-reset'],
      10,
    );
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
  const safeMode = options?.safeMode ?? false;

  for (const [methodName, def] of Object.entries(endpoints)) {
    // eslint-disable-next-line security/detect-object-injection
    (client as Record<string, (...args: unknown[]) => Promise<unknown>>)[
      methodName
    ] = async (...args: unknown[]) => {
      try {
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

        // Opt-in request body validation
        if (
          apiClient.getValidateRequest() &&
          def.requestSchema &&
          body != null
        ) {
          const reqResult = def.requestSchema.safeParse(body);
          if (!reqResult.success) {
            throw new EsiValidationError(
              `${apiClient.getLink()}/${path}`,
              reqResult.error,
              undefined,
              'request',
            );
          }
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

          if (returnMetadata || safeMode) {
            const meta = buildMeta(response);
            if (safeMode) {
              return { ok: true, data: cursorResult, meta };
            }
            return { data: cursorResult, meta };
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
        if (safeMode) {
          return { ok: true, data: responseBody, meta: buildMeta(response) };
        }
        if (returnMetadata) {
          return { data: responseBody, meta: buildMeta(response) };
        }
        return responseBody;
      } catch (err) {
        if (safeMode) {
          const error =
            err instanceof EsiError
              ? err
              : new EsiError(
                  0,
                  err instanceof Error ? err.message : String(err),
                );
          return { ok: false, error };
        }
        throw err;
      }
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
