/**
 * A mock `HttpTransport` for an application's own tests.
 *
 * `createMockTransport()` answers the requests the SDK sends from a table of
 * routes and records every request it saw. It is passed to
 * `createEsi({ transport })`, so everything between the application's call
 * and the transport (URL building, headers, retries, the cache, pagination,
 * response validation) is the SDK's real pipeline.
 *
 * Specification: tests/bdd/features/core/0057-mock-transport.feature.
 */
import type { HttpTransport } from '../core/ports/HttpTransport';

/** What the mock transport answers a request with. */
export interface MockRoute {
  /**
   * The HTTP method the route answers, compared without regard to case.
   * Omitted, the route answers any method.
   */
  readonly method?: string;
  /**
   * The ESI path template as the spec writes it, such as
   * `/characters/{character_id}/wallet`, where `{name}` stands for one path
   * segment; a trailing slash is ignored. Or a regular expression tested
   * against the whole URL, query string included.
   */
  readonly path: string | RegExp;
  /** The HTTP status. Default 200. */
  readonly status?: number;
  /** Response headers, such as `x-pages` or `etag`. */
  readonly headers?: Readonly<Record<string, string>>;
  /**
   * The response body. An object, array, number or boolean is JSON-encoded
   * and sent as `application/json`; a string is sent verbatim; omitted, the
   * response has no body.
   */
  readonly body?: unknown;
  /**
   * How many matching requests the route answers before it is retired.
   * Omitted, the route answers every matching request.
   */
  readonly times?: number;
}

/** One request the mock transport received. */
export interface SentRequest {
  /** The HTTP method, upper case. */
  readonly method: string;
  /** The full URL, query string included. */
  readonly url: string;
  /** Request headers, names in lower case. */
  readonly headers: Readonly<Record<string, string>>;
  /** The request body as a string, or `undefined` when the request had none. */
  readonly body: string | undefined;
}

/**
 * An `HttpTransport` that answers from a route table and records what it
 * received. Callable in place of `fetch`.
 */
export interface MockTransport extends HttpTransport {
  /** Add a route. Routes are tried in the order added; the first match answers. Returns the transport, for chaining. */
  respond(route: MockRoute): MockTransport;
  /** The routes still able to answer, in order. */
  readonly routes: readonly MockRoute[];
  /** Every request received, in the order sent. */
  readonly sent: readonly SentRequest[];
  /** The `METHOD url` of every request no route answered, in order. */
  readonly unrouted: readonly string[];
  /** Forget every route and every recorded request. */
  reset(): void;
}

interface ActiveRoute {
  readonly route: MockRoute;
  readonly method: string | undefined;
  readonly matcher: (url: URL) => boolean;
  remaining: number;
}

/** Statuses whose responses carry no body; the Response constructor rejects even ''. */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

/** A path template as the ESI spec writes it, `{name}` standing for one segment. */
function templateMatcher(template: string): (url: URL) => boolean {
  let trimmed = template;
  while (trimmed.endsWith('/')) trimmed = trimmed.slice(0, -1);
  const pattern = trimmed
    .split('/')
    .map((segment) =>
      /^\{[^}]+\}$/.test(segment)
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  const expression = new RegExp(`^${pattern}/?$`);
  return (url) => expression.test(url.pathname);
}

function matcherFor(path: string | RegExp): (url: URL) => boolean {
  if (typeof path === 'string') return templateMatcher(path);
  return (url) => {
    path.lastIndex = 0;
    return path.test(url.href);
  };
}

function activate(route: MockRoute): ActiveRoute {
  if (
    route.times !== undefined &&
    (!Number.isInteger(route.times) || route.times < 1)
  ) {
    throw new Error(
      `createMockTransport: times must be a positive integer, got ${String(route.times)}`,
    );
  }
  return {
    route,
    method: route.method?.toUpperCase(),
    matcher: matcherFor(route.path),
    remaining: route.times ?? Number.POSITIVE_INFINITY,
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function requestHeaders(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Record<string, string> {
  const headers: Record<string, string> = {};
  const source =
    init?.headers ??
    (typeof input === 'object' && !(input instanceof URL)
      ? input.headers
      : undefined);
  if (source) {
    new Headers(source).forEach((value, name) => {
      headers[name] = value;
    });
  }
  return headers;
}

async function requestBody(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): Promise<string | undefined> {
  const body = init?.body;
  if (body === undefined || body === null) {
    if (typeof input === 'object' && !(input instanceof URL) && input.body) {
      return input.clone().text();
    }
    return undefined;
  }
  if (typeof body === 'string') return body;
  return new Response(body).text();
}

function encode(route: MockRoute): {
  body: string | null;
  status: number;
  headers: Record<string, string>;
} {
  const status = route.status ?? 200;
  const headers: Record<string, string> = { ...route.headers };
  let body: string | null = null;
  if (typeof route.body === 'string') {
    body = route.body;
  } else if (route.body !== undefined) {
    body = JSON.stringify(route.body);
    const hasContentType = Object.keys(headers).some(
      (name) => name.toLowerCase() === 'content-type',
    );
    if (!hasContentType) headers['content-type'] = 'application/json';
  }
  if (NULL_BODY_STATUSES.has(status)) {
    if (body !== null && body !== '') {
      throw new Error(
        `createMockTransport: a ${status} response cannot carry a body`,
      );
    }
    body = null;
  }
  return { body, status, headers };
}

function describeRoute(route: MockRoute): string {
  const method = route.method?.toUpperCase() ?? 'ANY';
  return `${method} ${String(route.path)}`;
}

/**
 * Builds a mock `HttpTransport` for tests. Pass it to
 * `createEsi({ transport })`; add routes with `respond()`; read what the
 * application sent from `sent`.
 *
 * A request no route answers is answered with status 501 and an error body
 * naming the request, which the pipeline raises as an `EsiError` without
 * retrying, and is listed under `unrouted`.
 */
export function createMockTransport(
  routes: readonly MockRoute[] = [],
): MockTransport {
  let active: ActiveRoute[] = routes.map(activate);
  const sent: SentRequest[] = [];
  const unrouted: string[] = [];

  const transport = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = requestUrl(input);
    const method = (
      init?.method ??
      (typeof input === 'object' && !(input instanceof URL)
        ? input.method
        : undefined) ??
      'GET'
    ).toUpperCase();
    sent.push({
      method,
      url,
      headers: requestHeaders(input, init),
      body: await requestBody(input, init),
    });

    const parsed = new URL(url);
    const index = active.findIndex(
      (candidate) =>
        (candidate.method === undefined || candidate.method === method) &&
        candidate.matcher(parsed),
    );
    if (index === -1) {
      const description = `${method} ${url}`;
      unrouted.push(description);
      const table =
        active.length === 0
          ? 'no routes'
          : `routes: ${active.map((candidate) => describeRoute(candidate.route)).join(', ')}`;
      return new Response(
        JSON.stringify({
          error: `createMockTransport has no route for ${description} (${table})`,
        }),
        {
          status: 501,
          statusText: 'No route in the mock transport',
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    const matched = active[index]!;
    matched.remaining -= 1;
    if (matched.remaining === 0) active.splice(index, 1);
    const encoded = encode(matched.route);
    return new Response(encoded.body, {
      status: encoded.status,
      headers: encoded.headers,
    });
  }) as MockTransport;

  Object.defineProperties(transport, {
    respond: {
      value: (route: MockRoute): MockTransport => {
        active.push(activate(route));
        return transport;
      },
    },
    routes: { get: () => active.map((candidate) => candidate.route) },
    sent: { get: () => sent.slice() },
    unrouted: { get: () => unrouted.slice() },
    reset: {
      value: (): void => {
        active = [];
        sent.length = 0;
        unrouted.length = 0;
      },
    },
  });
  return transport;
}
