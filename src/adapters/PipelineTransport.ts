/**
 * Backs the generated operations (`src/generated/`) with the existing request
 * pipeline: rate limiter, circuit breaker, deduplication, retry, ETag cache,
 * and the tenant, user agent and compatibility date headers. It holds no
 * state of its own, so every operation shares the ApiClient's budgets and
 * cache with the hand-written clients. When constructed with
 * `validateResponse: true`, a JSON body is checked against the operation's
 * generated Zod schema, as the hand-written clients check theirs.
 */
import type { ApiClient } from '../core/ApiClient';
import { handleRequest } from '../core/ApiRequestHandler';
import { warnIfDeprecated } from '../core/endpoints/deprecationWarning';
import { fetchPages } from '../core/pagination/AsyncPaginationIterator';
import type {
  OperationMeta,
  OperationRequest,
  OperationTransport,
  QueryValue,
} from '../core/ports/OperationTransport';
import {
  emptyListWhenNoContent,
  evictRejectedResponse,
  resolveCache,
} from '../core/requestPipeline';
import { EsiValidationError } from '../core/util/error';
import { validatePathParam, validateQueryParam } from '../core/util/validation';
import { responseSchemas } from './responseSchemas.generated';

interface BuiltRequest {
  /** Relative URL: the filled path plus its query string. */
  readonly url: string;
  /** The path template without its leading slash, as the TTL and rate-limit tables key it. */
  readonly template: string;
  readonly requiresAuth: boolean;
}

/**
 * Validates each value as it is (so a non-finite number is rejected, not sent
 * as `NaN`), then joins an array with commas: ESI takes an array query value
 * as one comma-separated value, as the hand-written clients send it.
 */
function queryString(name: string, value: QueryValue): string {
  const values: readonly (string | number | boolean)[] = Array.isArray(value)
    ? value
    : [value as string | number | boolean];
  return values.map((v) => validateQueryParam(name, v)).join(',');
}

function build(
  meta: OperationMeta,
  req: OperationRequest,
  datasource: string | undefined,
): BuiltRequest {
  const template = meta.path.replace(/^\//, '');
  const path = template.replace(/\{(\w+)\}/g, (_, name: string) =>
    encodeURIComponent(validatePathParam(name, req.path[name])),
  );
  // Encoded the way buildEndpointPath encodes it. The path follows the spec,
  // which has no trailing slash; the 54 hand-written routes that end in one
  // therefore do not share cache keys with their generated operation.
  const query: string[] = [];
  for (const [name, value] of Object.entries(req.query)) {
    if (value === undefined) continue;
    const encoded = validateQueryParam(name, queryString(name, value));
    query.push(`${name}=${encodeURIComponent(encoded)}`);
  }
  if (datasource) query.push(`datasource=${encodeURIComponent(datasource)}`);
  const search = query.join('&');
  return {
    url: search ? `${path}?${search}` : path,
    template,
    requiresAuth: meta.scopes.length > 0,
  };
}

export interface PipelineTransportOptions {
  /**
   * Check each body against the operation's generated schema. Off unless set:
   * the ApiClient's own `validateResponse` defaults to `true` for the
   * hand-written clients, so `createEsi` passes this only when its caller set
   * `validateResponse: true` explicitly.
   */
  readonly validateResponse?: boolean;
}

export class PipelineTransport implements OperationTransport {
  private readonly validate: boolean;

  constructor(
    private readonly client: ApiClient,
    options: PipelineTransportOptions = {},
  ) {
    this.validate = options.validateResponse === true;
  }

  async request<T>(meta: OperationMeta, req: OperationRequest): Promise<T> {
    this.warnIfDeprecated(meta);
    const { url, template, requiresAuth } = build(
      meta,
      req,
      this.client.getDatasource(),
    );
    const emptyWhenNoContent = meta.emptyWhenNoContent === true;
    const response = await handleRequest(
      this.client,
      url,
      meta.method,
      req.body,
      requiresAuth,
      true,
      template,
      undefined,
      meta.textResponse,
      emptyWhenNoContent,
    );
    // No content (a 204, or ESI's empty 200) on a route that documents it is
    // an empty list, read by the same helper the custom clients use.
    const body = emptyListWhenNoContent(response.body, emptyWhenNoContent);
    const schema = responseSchemas[meta.operationId];
    if (!schema || !this.validate) {
      return body as T;
    }
    const result = schema.safeParse(body);
    if (!result.success) {
      evictRejectedResponse(this.client, url, requiresAuth, resolveCache);
      throw new EsiValidationError(
        `${this.client.getLink()}/${url}`,
        result.error,
      );
    }
    return result.data as T;
  }

  /**
   * Logs when iteration starts, once per call, as `request` does. A page ESI
   * answers with no content on a route that documents it yields nothing.
   */
  async *paginate<T>(
    meta: OperationMeta,
    req: OperationRequest,
  ): AsyncIterable<T> {
    this.warnIfDeprecated(meta);
    const { url, template, requiresAuth } = build(
      meta,
      req,
      this.client.getDatasource(),
    );
    for await (const page of fetchPages<T>(
      this.client,
      url,
      meta.method,
      requiresAuth,
      req.body,
      template,
      this.validate ? responseSchemas[meta.operationId] : undefined,
      meta.emptyWhenNoContent === true,
    )) {
      yield* page.data;
    }
  }

  /**
   * The custom clients' warning (`createClient`), worded by the same helper:
   * on every operation the spec deprecates, with the overlay's guidance.
   */
  private warnIfDeprecated(meta: OperationMeta): void {
    warnIfDeprecated(
      this.client,
      'Operation',
      meta.operationId,
      meta.deprecation ?? (meta.deprecated ? {} : undefined),
      { operationId: meta.operationId },
    );
  }
}
