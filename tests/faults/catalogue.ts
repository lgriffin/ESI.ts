/**
 * The fault catalogue: everything a network can do to an ESI exchange, each
 * with the Rule that specifies the client's answer and the exact outcome.
 *
 * A fault transforms the target's good exchange. Its outcome names the
 * settlement (error class, status, message; or the resolved value and
 * staleness), the number of requests (so the retry count), what the cache
 * holds afterwards, the clock time the call took and every warn/error log
 * entry. `catalogue.selftest.test.ts` rejects a fault that leaves any of
 * those open or cites a Rule that does not exist.
 */
import type { HttpResponse } from '../bdd/support/transport';
import type {
  ExpectedLog,
  Fault,
  FaultContext,
  Outcome,
  TargetTraits,
} from './types';

// ── Helpers ────────────────────────────────────────────────────────────

const isGet = (t: TargetTraits) => t.method === 'GET';

/** Attempts the client makes at a retryable failure. */
const attempts = (t: TargetTraits) => (isGet(t) ? t.retries + 1 : 1);

/** Requests the good exchange takes. */
const goodRequests = (ctx: FaultContext) => ctx.good.responses.length;

/** No timer in play: the call settles on the same virtual instant, give or take backoff. */
const INSTANT = { min: 0, max: 50 } as const;

const retryLogs = (t: TargetTraits, status: number): ExpectedLog[] => [
  {
    level: 'warn',
    message: new RegExp(
      `^Request to \\S+ failed \\(${status}\\), retrying in \\d+ms \\(attempt \\d+/\\d+\\)$`,
    ),
    count: attempts(t) - 1,
  },
];

const first = (ctx: FaultContext): HttpResponse => ctx.good.responses[0]!;

/** The first response with its pagination header removed. */
const singlePage = (r: HttpResponse): HttpResponse => {
  const headers = { ...r.headers };
  delete headers['x-pages'];
  const { match: _match, ...rest } = r;
  return { ...rest, headers };
};

const repeat = (r: HttpResponse, times: number): HttpResponse => ({
  ...r,
  times,
});

const withHeaders = (
  r: HttpResponse,
  headers: Record<string, string>,
): HttpResponse => ({ ...r, headers: { ...r.headers, ...headers } });

const errorResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): HttpResponse => ({ status, body, headers });

const HTML_OUTAGE =
  '<html><head><title>503 Service Temporarily Unavailable</title></head><body>ESI is down</body></html>';

const html = (status: number): HttpResponse => ({
  status,
  headers: { 'content-type': 'text/html' },
  body: HTML_OUTAGE,
});

/** Parse errors reach the caller double-wrapped and log twice. */
const jsonParseRejection = (): Outcome => ({
  settlement: {
    rejects: {
      class: 'CodedError',
      code: 'JSON_PARSE_ERROR',
      message:
        /^\[ESIJS_ERROR\] \[JSON_PARSE_ERROR\] Invalid JSON response: \S/,
    },
  },
  requests: 1,
  cache: 'empty',
  elapsedMs: INSTANT,
  logs: [
    { level: 'error', message: /^Failed to parse JSON response: /, count: 1 },
    {
      level: 'error',
      message: /^Unexpected error: \[JSON_PARSE_ERROR\]/,
      count: 1,
    },
  ],
});

const resolvesGood = (
  ctx: FaultContext,
  extra: Partial<Outcome> = {},
): Outcome => ({
  settlement: { resolves: ctx.good.result, stale: false },
  requests: goodRequests(ctx),
  cache: isGet(ctx.target) ? 'holds-result' : 'empty',
  elapsedMs: INSTANT,
  logs: [],
  ...extra,
});

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

/** Rebuild a JSON value bottom-up, applying fn to every node after its children. */
function mapJson(value: Json, fn: (v: Json) => Json): Json {
  if (Array.isArray(value)) return fn(value.map((v) => mapJson(v, fn)));
  if (value !== null && typeof value === 'object') {
    return fn(
      Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, mapJson(v, fn)]),
      ),
    );
  }
  return fn(value);
}

/** Every number made negative: schema-valid, semantically absurd. */
const negateNumbers = (body: unknown) =>
  mapJson(body as Json, (v) => (typeof v === 'number' ? -Math.abs(v) - 1 : v));

/** An unknown field added to every object. */
const addUnknownFields = (body: unknown) =>
  mapJson(body as Json, (v) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? { ...v, x_future_field: { added_by: 'ESI', rev: 2 } }
      : v,
  );

/** The first field of the first object removed (every target's is required). */
function dropFirstField(body: unknown): Json {
  const copy = JSON.parse(JSON.stringify(body)) as Json;
  const obj = (Array.isArray(copy) ? copy[0] : copy) as Record<string, Json>;
  delete obj[Object.keys(obj)[0]!];
  return copy;
}

const PAGINATION = {
  guide: 'PAGINATION.md',
  section: 'Offset: the eager default',
} as const;

// ── The catalogue ──────────────────────────────────────────────────────

export const FAULTS: readonly Fault[] = [
  // ── Bodies that are not the JSON they claim to be ───────────────────
  {
    id: 'truncated-json-body',
    title: '200 whose JSON body stops half way, framing intact',
    rule: { guide: 'ERRORS.md', section: 'Plumbing and configuration faults' },
    exchange: (ctx) => {
      const text = JSON.stringify(first(ctx).body);
      return [
        singlePage({ ...first(ctx), body: text.slice(0, text.length / 2) }),
      ];
    },
    expected: jsonParseRejection,
  },
  {
    id: 'html-body-on-200',
    title: '200 carrying a text/html maintenance page',
    rule: { guide: 'ERRORS.md', section: 'Plumbing and configuration faults' },
    exchange: () => [
      {
        status: 200,
        headers: { 'content-type': 'text/html' },
        body: HTML_OUTAGE,
      },
    ],
    expected: jsonParseRejection,
  },
  {
    id: 'empty-body-on-200',
    title: '200 with Content-Type application/json and no body',
    rule: { guide: 'ERRORS.md', section: 'Plumbing and configuration faults' },
    exchange: () => [
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '',
      },
    ],
    expected: jsonParseRejection,
  },
  {
    id: 'json-with-wrong-content-type',
    title: '200 whose valid JSON body is labelled text/plain',
    rule: {
      feature: 'core/0053-runtime-validation.feature',
      rule: 'When a response satisfies the endpoint schema, the EsiClient shall return the parsed object with every field the schema declares.',
    },
    exchange: (ctx) => [
      withHeaders(first(ctx), { 'content-type': 'text/plain' }),
      ...ctx.good.responses.slice(1),
    ],
    expected: (ctx) => resolvesGood(ctx),
  },

  // ── Freshness headers ESI gets wrong ─────────────────────────────────
  {
    id: 'expires-in-the-past',
    title: '200 whose Expires header is already in the past',
    appliesTo: isGet,
    rule: {
      feature: 'core/0050-etag-caching.feature',
      rule: 'When a response carrying an ETag header is received, the ETag cache shall store the response body against the requested endpoint.',
    },
    exchange: (ctx) => [
      withHeaders(first(ctx), { expires: 'Wed, 01 Jan 2020 00:00:00 GMT' }),
      ...ctx.good.responses.slice(1),
    ],
    expected: (ctx) => resolvesGood(ctx),
  },
  {
    id: 'expires-unparseable',
    title: '200 whose Expires header is not a date',
    appliesTo: isGet,
    rule: {
      feature: 'core/0050-etag-caching.feature',
      rule: 'When a response carrying an ETag header is received, the ETag cache shall store the response body against the requested endpoint.',
    },
    exchange: (ctx) => [
      withHeaders(first(ctx), {
        expires: 'soon-ish',
        'cache-control': 'max-age=banana',
      }),
      ...ctx.good.responses.slice(1),
    ],
    expected: (ctx) => resolvesGood(ctx),
  },

  // ── 304s the client did not bargain for ──────────────────────────────
  {
    id: 'revalidation-304-without-etag',
    title: '304 to a conditional request, with no ETag header on the 304',
    appliesTo: isGet,
    prime: true,
    rule: {
      feature: 'core/0050-etag-caching.feature',
      rule: 'When a revalidation is answered with HTTP 304, the ETag cache shall restart the freshness TTL of the cached entry.',
    },
    exchange: () => [{ status: 304, headers: {} }],
    expected: (ctx) => resolvesGood(ctx, { requests: 1 }),
  },
  {
    id: 'unsolicited-304-without-cached-entry',
    title: '304 to a request that carried no If-None-Match',
    rule: {
      guide: 'ERRORS.md',
      section: 'Status handling before an error is thrown',
    },
    exchange: () => [{ status: 304, headers: {} }],
    expected: () => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 304,
          message: /^Not Modified — no cached data available$/,
        },
      },
      requests: 1,
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: [],
    }),
  },

  // ── Connections that fail ────────────────────────────────────────────
  {
    id: 'connection-reset-before-headers',
    title: 'ECONNRESET before any response, on every attempt',
    rule: { guide: 'ERRORS.md', section: 'Retryability' },
    exchange: (ctx) => [
      repeat(
        { fault: { kind: 'connection-error', code: 'ECONNRESET' } },
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 0,
          message: /^Network request failed: fetch failed$/,
        },
      },
      requests: attempts(ctx.target),
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: retryLogs(ctx.target, 0),
    }),
  },
  {
    id: 'connection-reset-then-recovers',
    title: 'ECONNRESET on the first attempt, clean exchange on the retry',
    appliesTo: isGet,
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'When an attempt fails with a retryable error and a later attempt succeeds, the retry strategy shall return the successful result to the caller.',
    },
    exchange: (ctx) => [
      { fault: { kind: 'connection-error', code: 'ECONNREFUSED' } },
      ...ctx.good.responses,
    ],
    expected: (ctx) =>
      resolvesGood(ctx, {
        requests: goodRequests(ctx) + 1,
        logs: [
          {
            level: 'warn',
            message:
              /^Request to \S+ failed \(0\), retrying in \d+ms \(attempt 1\/\d+\)$/,
            count: 1,
          },
        ],
      }),
  },
  {
    id: 'connection-reset-mid-body',
    title:
      'Headers arrive, then ECONNRESET part way through the body, on every attempt',
    rule: { guide: 'ERRORS.md', section: 'Retryability' },
    exchange: (ctx) => [
      repeat(
        {
          ...singlePage(first(ctx)),
          fault: { kind: 'body-error', code: 'ECONNRESET', bytes: 12 },
        },
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 0,
          message: /^Network request failed: terminated$/,
        },
      },
      requests: attempts(ctx.target),
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: retryLogs(ctx.target, 0),
    }),
  },
  {
    id: 'body-stalls-after-headers',
    title:
      'Headers arrive, then the body stops arriving (socket timeout), on every attempt',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If every attempt at a request exceeds the configured timeout, then the EsiClient shall reject the call with a TimeoutError.',
    },
    exchange: (ctx) => [
      repeat(
        { ...singlePage(first(ctx)), fault: { kind: 'body-stall', bytes: 12 } },
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'TimeoutError',
          statusCode: 0,
          message: new RegExp(
            `^Request timed out after ${ctx.target.timeoutMs}ms$`,
          ),
        },
      },
      requests: attempts(ctx.target),
      cache: 'empty',
      elapsedMs: {
        min: attempts(ctx.target) * ctx.target.timeoutMs,
        max: attempts(ctx.target) * ctx.target.timeoutMs + 50,
      },
      logs: retryLogs(ctx.target, 0),
    }),
  },
  {
    id: 'no-response-before-timeout',
    title: 'No status line before the timeout, on every attempt',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If every attempt at a request exceeds the configured timeout, then the EsiClient shall reject the call with a TimeoutError.',
    },
    exchange: (ctx) => [
      repeat(
        { ...singlePage(first(ctx)), delayMs: ctx.target.timeoutMs * 4 },
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'TimeoutError',
          statusCode: 0,
          message: new RegExp(
            `^Request timed out after ${ctx.target.timeoutMs}ms$`,
          ),
        },
      },
      requests: attempts(ctx.target),
      cache: 'empty',
      elapsedMs: {
        min: attempts(ctx.target) * ctx.target.timeoutMs,
        max: attempts(ctx.target) * ctx.target.timeoutMs + 50,
      },
      logs: retryLogs(ctx.target, 0),
    }),
  },

  // ── Server errors ────────────────────────────────────────────────────
  {
    id: 'service-unavailable-html-body',
    title: '503 with an HTML body instead of ESI error JSON, on every attempt',
    appliesTo: isGet,
    rule: {
      feature: 'core/0050-etag-caching.feature',
      rule: 'If a GET request is answered with a 5xx status and the ETag cache holds no entry for it, then the EsiClient shall reject with an EsiError carrying that status.',
    },
    exchange: (ctx) => [repeat(html(503), attempts(ctx.target))],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 503,
          message: /^Service Unavailable$/,
        },
      },
      requests: attempts(ctx.target),
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: retryLogs(ctx.target, 503),
    }),
  },
  {
    id: 'bad-gateway-without-reason-phrase',
    title:
      '502 over HTTP/2 (no reason phrase) with an HTML body, on every attempt',
    rule: {
      guide: 'ERRORS.md',
      section: 'Status handling before an error is thrown',
    },
    exchange: (ctx) => [repeat(html(502), attempts(ctx.target))],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 502,
          message: /^Bad Gateway$/,
        },
      },
      requests: attempts(ctx.target),
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: retryLogs(ctx.target, 502),
    }),
  },
  {
    id: 'bad-request-while-cached',
    title: '400 with ESI error JSON while the cache holds an entry',
    appliesTo: isGet,
    prime: true,
    rule: {
      feature: 'core/0050-etag-caching.feature',
      rule: 'If a GET request is answered with a 4xx status, then the EsiClient shall reject with an EsiError even while the ETag cache holds an entry for it.',
    },
    exchange: () => [
      errorResponse(400, { error: 'Invalid datasource parameter' }),
    ],
    expected: () => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 400,
          message: /^Bad Request: Invalid datasource parameter$/,
        },
      },
      requests: 1,
      cache: 'holds-result',
      elapsedMs: INSTANT,
      logs: [],
    }),
  },
  {
    id: 'internal-error-with-esi-reason',
    title: '500 with ESI error JSON',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If a GET request is answered with HTTP 400, 401, 403, 404, or 500, then the EsiClient shall reject with an EsiError carrying that status after a single request.',
    },
    exchange: () => [
      errorResponse(500, {
        error: 'Undefined 500 response. Original message: boom',
      }),
    ],
    expected: () => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 500,
          message:
            /^Internal server error: Undefined 500 response\. Original message: boom$/,
        },
      },
      requests: 1,
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: [],
    }),
  },
  {
    id: 'service-unavailable-with-cached-entry',
    title: '503 with an HTML body while the cache holds an entry',
    appliesTo: isGet,
    prime: true,
    rule: {
      feature: 'core/0050-etag-caching.feature',
      rule: 'If a GET request is answered with a 5xx status while the ETag cache holds an unexpired entry for it, then the EsiClient shall resolve with the cached body and flag the response as stale.',
    },
    exchange: () => [html(503)],
    expected: (ctx) => ({
      settlement: { resolves: ctx.good.result, stale: true },
      requests: 1,
      cache: 'holds-result',
      elapsedMs: INSTANT,
      logs: [
        {
          level: 'warn',
          message: /^Service Unavailable for \S+ — serving stale cache$/,
          count: 1,
        },
      ],
    }),
  },
  {
    id: 'unnamed-status-without-reason-phrase',
    title: 'Cloudflare 524 over HTTP/2 (no reason phrase) with an HTML body',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If a request is answered with an error status that carries no reason phrase, then the EsiClient shall reject with an EsiError whose message names that status.',
    },
    exchange: () => [html(524)],
    expected: () => ({
      settlement: {
        rejects: { class: 'EsiError', statusCode: 524, message: /^HTTP 524$/ },
      },
      requests: 1,
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: [],
    }),
  },
  {
    id: 'mutation-service-unavailable',
    title: '503 to a POST',
    appliesTo: (t) => !isGet(t),
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If a non-GET request is answered with HTTP 503, then the EsiClient shall reject after a single request.',
    },
    exchange: () => [html(503)],
    expected: () => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 503,
          message: /^Service Unavailable$/,
        },
      },
      requests: 1,
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: [],
    }),
  },

  // ── Throttling ───────────────────────────────────────────────────────
  {
    id: 'error-limited-with-error-limit-headers',
    title: '420 with X-ESI-Error-Limit-Remain 0 and Reset 7, on every attempt',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If a GET request is answered with HTTP 420 or 429 while retries remain, then the request pipeline shall issue the same request again.',
    },
    exchange: (ctx) => [
      repeat(
        errorResponse(
          420,
          { error: 'This software has exceeded the error limit for ESI.' },
          {
            'x-esi-error-limit-remain': '0',
            'x-esi-error-limit-reset': '7',
          },
        ),
        attempts(ctx.target),
      ),
    ],
    // Each retry waits out the 60 s group block, then the 7 s error-limit reset.
    expected: (ctx) =>
      throttled(
        ctx.target,
        420,
        'Error Limited: This software has exceeded the error limit for ESI.',
        60_000 + 7_000,
        [
          {
            level: 'warn',
            message: /^\[ESI Rate Limit\] Group '[^']+' blocked for 60s/,
            count: attempts(ctx.target) - 1,
          },
          {
            level: 'warn',
            message:
              /^\[ESI Rate Limit\] Legacy error limit exhausted, waiting 7s$/,
            count: attempts(ctx.target) - 1,
          },
        ],
      ),
  },
  {
    id: 'error-limited-without-headers',
    title: '420 with no rate-limit headers, on every attempt',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If a GET request is answered with HTTP 420 or 429 while retries remain, then the request pipeline shall issue the same request again.',
    },
    exchange: (ctx) => [
      repeat(
        errorResponse(420, { error: 'Error limited' }),
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) =>
      throttled(ctx.target, 420, 'Error Limited: Error limited', 60_000, [
        {
          level: 'warn',
          message: /^\[ESI Rate Limit\] Group '[^']+' blocked for 60s/,
          count: attempts(ctx.target) - 1,
        },
      ]),
  },
  {
    id: 'too-many-requests-retry-after-seconds',
    title: '429 with Retry-After: 5, on every attempt',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If every attempt at a request is answered with 429, then the EsiClient shall reject the call with an EsiError carrying status code 429.',
    },
    exchange: (ctx) => [
      repeat(
        errorResponse(
          429,
          { error: 'Too many requests' },
          { 'retry-after': '5' },
        ),
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) =>
      throttled(
        ctx.target,
        429,
        'Too many requests: Too many requests',
        5_000,
        [
          {
            level: 'warn',
            message: /^\[ESI Rate Limit\] Group '[^']+' blocked for 5s/,
            count: attempts(ctx.target) - 1,
          },
        ],
      ),
  },
  {
    id: 'too-many-requests-without-retry-after',
    title: '429 with no Retry-After, on every attempt',
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If every attempt at a request is answered with 429, then the EsiClient shall reject the call with an EsiError carrying status code 429.',
    },
    exchange: (ctx) => [
      repeat(
        errorResponse(429, { error: 'Too many requests' }),
        attempts(ctx.target),
      ),
    ],
    expected: (ctx) =>
      throttled(
        ctx.target,
        429,
        'Too many requests: Too many requests',
        60_000,
        [
          {
            level: 'warn',
            message: /^\[ESI Rate Limit\] Group '[^']+' blocked for 60s/,
            count: attempts(ctx.target) - 1,
          },
        ],
      ),
  },
  {
    id: 'too-many-requests-retry-after-http-date',
    title:
      '429 whose Retry-After is an HTTP date 5 s ahead, then a clean retry',
    appliesTo: isGet,
    rule: {
      feature: 'core/0051-resilience.feature',
      rule: 'If a GET request is answered with HTTP 420 or 429 while retries remain, then the request pipeline shall issue the same request again.',
    },
    exchange: (ctx) => [
      errorResponse(
        429,
        { error: 'Too many requests' },
        {
          'retry-after': new Date(Date.now() + 5_000).toUTCString(),
        },
      ),
      ...ctx.good.responses,
    ],
    expected: (ctx) =>
      resolvesGood(ctx, {
        requests: goodRequests(ctx) + 1,
        elapsedMs: { min: 5_000, max: 5_050 },
        logs: [
          { level: 'warn', message: /^Rate limited \(429\) on /, count: 1 },
          {
            level: 'warn',
            message:
              /^Request to \S+ failed \(429\), retrying in \d+ms \(attempt 1\/\d+\)$/,
            count: 1,
          },
          {
            level: 'warn',
            message: /^\[ESI Rate Limit\] Group '[^']+' blocked for 5s/,
            count: 1,
          },
        ],
      }),
  },

  // ── Pagination that moves under the client ───────────────────────────
  {
    id: 'x-pages-grows-between-pages',
    title: 'Page 1 says X-Pages 2; page 2 says X-Pages 3',
    appliesTo: (t) => t.paginated,
    rule: PAGINATION,
    exchange: (ctx) => [
      first(ctx),
      withHeaders(ctx.good.responses[1]!, { 'x-pages': '3' }),
    ],
    // Page 1's X-Pages is authoritative; later pages' headers are not read.
    expected: (ctx) => resolvesGood(ctx),
  },
  {
    id: 'x-pages-shrinks-to-empty-page',
    title: 'Page 1 says X-Pages 3; page 3 comes back empty',
    appliesTo: (t) => t.paginated,
    rule: PAGINATION,
    exchange: (ctx) => [
      withHeaders(first(ctx), { 'x-pages': '3' }),
      withHeaders(ctx.good.responses[1]!, { 'x-pages': '2' }),
      {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-pages': '2' },
        body: [],
        match: 'page=3',
      },
    ],
    expected: (ctx) =>
      resolvesGood(ctx, {
        requests: 3,
        logs: [
          {
            level: 'warn',
            message: /^Page 3 is empty\. Stopping pagination\.$/,
            count: 1,
          },
        ],
      }),
  },
  {
    id: 'x-pages-shrinks-to-missing-page',
    title: 'Page 1 says X-Pages 3; page 3 answers 404',
    appliesTo: (t) => t.paginated,
    rule: PAGINATION,
    exchange: (ctx) => [
      withHeaders(first(ctx), { 'x-pages': '3' }),
      withHeaders(ctx.good.responses[1]!, { 'x-pages': '2' }),
      {
        ...errorResponse(404, { error: 'Requested page does not exist!' }),
        match: 'page=3',
      },
    ],
    expected: () => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 404,
          message: /^Resource not found: Requested page does not exist!$/,
        },
      },
      requests: 3,
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: [
        { level: 'error', message: /^Failed to fetch page 3: /, count: 1 },
        { level: 'warn', message: /^Pagination failed for /, count: 1 },
      ],
    }),
  },
  {
    id: 'later-page-unavailable',
    title: 'Page 1 clean; page 2 answers 503 on every attempt',
    appliesTo: (t) => t.paginated,
    rule: PAGINATION,
    exchange: (ctx) => [
      first(ctx),
      { ...repeat(html(503), attempts(ctx.target)), match: 'page=2' },
    ],
    expected: (ctx) => ({
      settlement: {
        rejects: {
          class: 'EsiError',
          statusCode: 503,
          message: /^Service Unavailable$/,
        },
      },
      requests: 1 + attempts(ctx.target),
      cache: 'empty',
      elapsedMs: INSTANT,
      logs: [
        ...retryLogs(ctx.target, 503),
        { level: 'error', message: /^Failed to fetch page 2: /, count: 1 },
        { level: 'warn', message: /^Pagination failed for /, count: 1 },
      ],
    }),
  },

  // ── Payloads ─────────────────────────────────────────────────────────
  {
    id: 'schema-violating-body',
    title: '200 whose body lacks a field the schema requires',
    rule: {
      feature: 'core/0053-runtime-validation.feature',
      rule: 'If a response fails schema validation, then the EsiClient shall reject the call with an EsiValidationError carrying the underlying Zod issues.',
    },
    exchange: (ctx) => [
      singlePage({ ...first(ctx), body: dropFirstField(first(ctx).body) }),
    ],
    expected: (ctx) => validationRejection(ctx),
  },
  {
    id: 'null-body',
    title: '200 whose body is the JSON literal null',
    rule: {
      feature: 'core/0053-runtime-validation.feature',
      rule: 'If a response fails schema validation, then the EsiClient shall reject the call with an EsiValidationError carrying the underlying Zod issues.',
    },
    exchange: (ctx) => [singlePage({ ...first(ctx), body: 'null' })],
    expected: (ctx) => validationRejection(ctx),
  },
  {
    id: 'unknown-fields-added',
    title: '200 whose objects carry fields the schema does not declare',
    rule: {
      feature: 'core/0053-runtime-validation.feature',
      rule: 'When a response carries fields the endpoint schema does not declare, the EsiClient shall include those fields in the returned object.',
    },
    exchange: (ctx) =>
      ctx.good.responses.map((r) => ({ ...r, body: addUnknownFields(r.body) })),
    expected: (ctx) => ({
      ...resolvesGood(ctx),
      settlement: { resolves: addUnknownFields(ctx.good.result), stale: false },
    }),
  },
  {
    id: 'semantically-absurd-values',
    title:
      '200 whose numbers are all negative (volume_remain -251, players -23457)',
    rule: {
      feature: 'core/0053-runtime-validation.feature',
      rule: 'When a response satisfies the endpoint schema, the EsiClient shall return the parsed object with every field the schema declares.',
    },
    exchange: (ctx) =>
      ctx.good.responses.map((r) => ({ ...r, body: negateNumbers(r.body) })),
    // The schemas check shape, not domain invariants: ESI is the source of
    // truth, so absurd values pass through unchanged and unlogged.
    expected: (ctx) => ({
      ...resolvesGood(ctx),
      settlement: { resolves: negateNumbers(ctx.good.result), stale: false },
    }),
  },
];

function throttled(
  t: TargetTraits,
  status: 420 | 429,
  message: string,
  waitPerRetryMs: number,
  limiterLogs: ExpectedLog[],
): Outcome {
  const n = attempts(t);
  const escaped = message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    settlement: {
      rejects: {
        class: 'EsiError',
        statusCode: status,
        message: new RegExp(`^${escaped}$`),
      },
    },
    requests: n,
    cache: 'empty',
    elapsedMs: {
      min: (n - 1) * waitPerRetryMs,
      max: (n - 1) * waitPerRetryMs + 50,
    },
    logs: [
      {
        level: 'warn',
        message: new RegExp(`^Rate limited \\(${status}\\) on `),
        count: n,
      },
      ...retryLogs(t, status),
      ...limiterLogs,
    ],
  };
}

function validationRejection(ctx: FaultContext): Outcome {
  const url = `https://esi.evetech.net${ctx.target.path}`.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  );
  return {
    settlement: {
      rejects: {
        class: 'EsiValidationError',
        statusCode: 0,
        message: new RegExp(`^Response validation failed for ${url}$`),
      },
    },
    requests: 1,
    cache: 'empty',
    elapsedMs: INSTANT,
    logs: [],
  };
}
