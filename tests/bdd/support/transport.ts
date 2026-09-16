/**
 * The BDD transport seam.
 *
 * Scenarios describe what ESI sends over HTTP; the client under test runs its
 * real request pipeline (rate limiter, retry, ETag cache, deduplication,
 * circuit breaker, Zod validation) against those responses. Nothing between
 * the public client method and `fetch` is stubbed, so a scenario can fail for
 * a bug anywhere in `src/`.
 *
 * Usage, at the top of a `defineFeature` callback:
 *
 *   useHttpTransport();
 *   beforeEach(() => { client = createSeamClient(); });
 *
 *   given('...', () => queueResponse({ body: [...] }));
 *
 * Strictness is deliberate: a request with no queued response fails the
 * scenario, and so does a queued response that was never requested. Both mean
 * the scenario's picture of the HTTP exchange is wrong.
 */
import fetchMock from 'jest-fetch-mock';
import { EsiClient, EsiClientConfig } from '../../../src/EsiClient';

export interface HttpResponse {
  /** HTTP status. Default 200. 204, 205 and 304 are sent with no body. */
  status?: number;
  /** Response headers. `content-type: application/json` is added for JSON bodies. */
  headers?: Record<string, string>;
  /** Objects and arrays are JSON-encoded; strings are sent verbatim. */
  body?: unknown;
  /** Resolve the response after this many milliseconds. */
  delayMs?: number;
  /** Serve only requests whose URL contains this string or matches this pattern. */
  match?: string | RegExp;
  /** Serve this response for the next N matching requests. Default 1. */
  times?: number;
}

export interface RecordedRequest {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: string | undefined;
}

interface QueuedResponse extends HttpResponse {
  remaining: number;
}

interface MockRequest {
  url: string;
  method: string;
  headers: { forEach(cb: (value: string, key: string) => void): void };
  text(): Promise<string>;
}

let installed = false;
let queue: QueuedResponse[] = [];
let recorded: RecordedRequest[] = [];
let unexpected: string[] = [];

function matches(entry: QueuedResponse, url: string): boolean {
  if (entry.match === undefined) return true;
  return typeof entry.match === 'string'
    ? url.includes(entry.match)
    : entry.match.test(url);
}

function encode(response: HttpResponse): {
  body: string;
  status: number;
  headers: Record<string, string>;
} {
  const headers = { ...response.headers };
  let body = '';
  if (typeof response.body === 'string') {
    body = response.body;
  } else if (response.body !== undefined) {
    body = JSON.stringify(response.body);
    const hasContentType = Object.keys(headers).some(
      (k) => k.toLowerCase() === 'content-type',
    );
    if (!hasContentType) headers['content-type'] = 'application/json';
  }
  return { body, status: response.status ?? 200, headers };
}

async function serve(request: MockRequest) {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const text = await request.text().catch(() => '');
  recorded.push({
    method: request.method,
    url: new URL(request.url),
    headers,
    body: text === '' ? undefined : text,
  });

  const index = queue.findIndex((entry) => matches(entry, request.url));
  if (index === -1) {
    const description = `${request.method} ${request.url}`;
    unexpected.push(description);
    throw new Error(`No queued HTTP response for ${description}`);
  }

  const entry = queue[index];
  entry.remaining -= 1;
  if (entry.remaining === 0) queue.splice(index, 1);

  const reply = toReply(entry);
  if (!entry.delayMs) return reply;
  const delay = entry.delayMs;
  return new Promise<typeof reply>((resolve) =>
    setTimeout(() => resolve(reply), delay),
  );
}

/** Statuses whose responses carry no body; the Response constructor rejects even ''. */
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

function toReply(entry: HttpResponse) {
  const encoded = encode(entry);
  if (!NULL_BODY_STATUSES.has(encoded.status)) return encoded;
  if (encoded.body !== '') {
    throw new Error(`A ${encoded.status} response cannot carry a body`);
  }
  return new Response(null, {
    status: encoded.status,
    headers: encoded.headers,
  });
}

/**
 * Install the seam for every scenario in the enclosing `defineFeature`.
 * Call once, at the top of the callback.
 */
export function useHttpTransport(): void {
  beforeEach(() => {
    queue = [];
    recorded = [];
    unexpected = [];
    fetchMock.resetMocks();
    fetchMock.mockResponse((request) => serve(request as MockRequest));
    installed = true;
  });

  afterEach(() => {
    installed = false;
    const leftover = queue.map(
      (entry) =>
        `${entry.status ?? 200}${entry.match ? ` for ${String(entry.match)}` : ''} (x${entry.remaining})`,
    );
    const problems = [
      ...unexpected.map((d) => `unexpected request: ${d}`),
      ...leftover.map((d) => `queued response never requested: ${d}`),
    ];
    queue = [];
    unexpected = [];
    if (problems.length > 0) {
      throw new Error(
        `The scenario's HTTP exchange did not match what it queued:\n  ${problems.join('\n  ')}`,
      );
    }
  });
}

/** Queue one HTTP response (or `times` identical ones). */
export function queueResponse(response: HttpResponse = {}): void {
  if (!installed) {
    throw new Error(
      'queueResponse() called without useHttpTransport() in this feature',
    );
  }
  const times = response.times ?? 1;
  if (times < 1) throw new Error('times must be at least 1');
  queue.push({ ...response, remaining: times });
}

/** Queue responses in the order they will be served. */
export function queueResponses(...responses: HttpResponse[]): void {
  responses.forEach(queueResponse);
}

/**
 * Queue an ESI error response with the `{ "error": message }` body ESI sends.
 * `times` defaults to 1; pass the retry budget + 1 for statuses the client retries.
 */
export function queueError(
  status: number,
  message = 'error',
  options: Omit<HttpResponse, 'status' | 'body'> = {},
): void {
  queueResponse({ ...options, status, body: { error: message } });
}

/** Every request the client sent in this scenario, in order. */
export function sentRequests(): readonly RecordedRequest[] {
  return recorded;
}

/** The most recent request the client sent. Throws if there was none. */
export function lastRequest(): RecordedRequest {
  const last = recorded[recorded.length - 1];
  if (!last) throw new Error('The client sent no HTTP requests');
  return last;
}

/**
 * Retry settings the seam client uses: the library's default attempt count,
 * with delays shrunk so a scenario that exhausts them stays fast.
 */
export const SEAM_RETRY = { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 2 };

/** Requests a retryable failure (5xx) consumes before the client gives up. */
export const RETRYABLE_ATTEMPTS = SEAM_RETRY.maxRetries + 1;

/**
 * A real `EsiClient` wired for the seam: default pipeline, a test access token
 * so authenticated endpoints send a bearer header, no inter-request delay, and
 * millisecond retry backoff. Override any of it through `config`.
 */
export function createSeamClient(config: EsiClientConfig = {}): EsiClient {
  return new EsiClient({
    clientId: 'bdd-seam-client',
    baseUrl: 'https://esi.evetech.net',
    accessToken: 'bdd-access-token',
    timeout: 5000,
    retryConfig: SEAM_RETRY,
    logLevel: 'error',
    ...config,
    rateLimiterConfig: { minDelayMs: 0, ...config.rateLimiterConfig },
  });
}
