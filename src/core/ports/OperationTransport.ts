/**
 * The one seam generated operations (`src/generated/`) call.
 * `src/adapters/PipelineTransport` backs it with the existing request pipeline
 * (cache, auth, retry, rate limiter). Neither is exported yet: the new client
 * tree (Phase 2 PR 11) is their first public caller.
 */

/** How an operation splits its results across calls. */
export type OperationPagination = 'none' | 'page' | 'cursor';

export interface OperationMeta {
  readonly operationId: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Path template with `{name}` placeholders, as in the spec. */
  readonly path: string;
  /** SSO scopes the spec's security block requires; empty for public routes. */
  readonly scopes: readonly string[];
  /**
   * `page`: numbered pages counted by `X-Pages`. `cursor`: `before`/`after`
   * tokens in the response body.
   */
  readonly pagination: OperationPagination;
  /** The spec marks the operation `deprecated: true`. */
  readonly deprecated: boolean;
  /**
   * Header parameters the spec accepts (`X-Compatibility-Date`, `X-Tenant`,
   * `If-None-Match` and so on). They are client configuration, not call
   * arguments: the transport supplies them.
   */
  readonly headers: readonly string[];
}

/** Every shape a spec query parameter takes: scalars and arrays of them. */
export type QueryValue =
  string | number | boolean | readonly (string | number | boolean)[];

export interface OperationRequest {
  readonly path: Readonly<Record<string, string | number>>;
  readonly query: Readonly<Record<string, QueryValue | undefined>>;
  readonly body?: unknown;
}

export interface OperationTransport {
  request<T>(meta: OperationMeta, req: OperationRequest): Promise<T>;
  /** Follows `X-Pages`; yields one item at a time across every page. */
  paginate<T>(meta: OperationMeta, req: OperationRequest): AsyncIterable<T>;
}
