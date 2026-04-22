export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface EndpointDefinition {
  /** URL template with placeholders, e.g. 'alliances/{allianceId}/' */
  path: string;
  /** HTTP method */
  method: HttpMethod;
  /** Whether the endpoint requires an auth token */
  requiresAuth: boolean;
  /** Path parameter names in method signature order */
  pathParams?: readonly string[];
  /** Maps method param name to query string key, e.g. { typeId: 'type_id' } */
  queryParams?: Record<string, string>;
  /** Whether the method accepts a body parameter (for POST/PUT/DELETE) */
  hasBody?: boolean;
  /** Custom body builder for endpoints that construct body from individual params */
  bodyBuilder?: (...args: any[]) => any;
  /** Whether this endpoint uses cursor-based pagination (before/after tokens) */
  cursorPagination?: boolean;
}

export type EndpointMap = Record<string, EndpointDefinition>;

// Type utilities for computing method signatures from endpoint definitions

/** Convert a readonly string tuple to a tuple of number | string (one per path param) */
type PathParamArgs<P> = P extends readonly [
  any,
  ...infer Rest extends readonly any[],
]
  ? [number | string, ...PathParamArgs<Rest>]
  : [];

/** Compute the method parameter tuple from an endpoint definition */
export type EndpointArgs<D> = D extends {
  pathParams: infer P extends readonly string[];
}
  ? D extends { bodyBuilder: (...args: infer BA) => any }
    ? [...PathParamArgs<P>, ...BA]
    : D extends { hasBody: true }
      ? [...PathParamArgs<P>, body: object]
      : D extends { queryParams: Record<string, string> }
        ? [...PathParamArgs<P>, ...(string | number | undefined)[]]
        : PathParamArgs<P>
  : D extends { bodyBuilder: (...args: infer BA) => any }
    ? BA
    : D extends { hasBody: true }
      ? [body: object]
      : D extends { queryParams: Record<string, string> }
        ? (string | number | undefined)[]
        : [];
