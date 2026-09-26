/**
 * The one seam generated operations call. In the real client this is the
 * existing request pipeline (cache, auth, retry, rate limiter); the spike only
 * needs its shape.
 */
export interface OperationMeta {
  readonly operationId: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Path template with `{name}` placeholders, as in the spec. */
  readonly path: string;
  /** SSO scopes the spec's security block requires; empty for public routes. */
  readonly scopes: readonly string[];
  readonly paginated: boolean;
}

export interface OperationRequest {
  readonly path: Readonly<Record<string, string | number>>;
  readonly query: Readonly<Record<string, string | number | undefined>>;
  readonly body?: unknown;
}

export interface Transport {
  request<T>(meta: OperationMeta, req: OperationRequest): Promise<T>;
  /** Follows X-Pages; yields one item at a time across every page. */
  paginate<T>(meta: OperationMeta, req: OperationRequest): AsyncIterable<T>;
}
