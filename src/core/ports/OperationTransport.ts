/**
 * The one seam generated operations (`src/generated/`) call.
 * `src/adapters/PipelineTransport` backs it with the existing request pipeline
 * (cache, auth, retry, rate limiter). Neither is exported yet: the new client
 * tree (Phase 2 PR 11) is their first public caller.
 */

/** How an operation splits its results across calls. */
export type OperationPagination = 'none' | 'page' | 'cursor';

/**
 * Migration guidance for a deprecated operation, from
 * `scripts/spec/operation-overlay.json`. Each field is optional: the spec
 * carries only the flag, so a field is present when the overlay names it.
 */
export interface OperationDeprecation {
  /** Why the operation is deprecated, or what to do instead. */
  readonly message?: string;
  /** The operationId of the operation that replaces it. */
  readonly replacedBy?: string;
  /** The date ESI stops serving it, `YYYY-MM-DD`. */
  readonly sunsetDate?: string;
}

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
   * What the generator knows about a deprecated operation, beyond the spec's
   * flag: why, what replaces it and when ESI stops serving it. Present on
   * every operation the spec deprecates; the transport logs a warning on
   * each call to an operation that carries it or has `deprecated` set.
   */
  readonly deprecation?: OperationDeprecation;
  /**
   * Read the body as text rather than JSON, asking for it with this Accept
   * header. Set on the few ESI routes that are not JSON, such as
   * `meta/openapi.yaml`.
   */
  readonly textResponse?: { readonly accept: string };
  /**
   * The spec pairs a JSON 200 holding an array with a 204: ESI answers with
   * no content (a 204, or a 200 with `Content-Length: 0`) when there is
   * nothing to return,
   * as for a public contract that expired or was accepted. The transport then
   * resolves with `[]` (or yields nothing) instead of failing to parse.
   */
  readonly emptyWhenNoContent?: boolean;
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
