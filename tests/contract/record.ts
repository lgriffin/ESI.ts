/**
 * npm run contract:record [-- --only=market.getMarketOrders,status.getStatus] [-- --report=<file>]
 *
 * Records one sanitised fixture per public (unauthenticated) GET endpoint
 * from live ESI into tests/contract/fixtures/recorded/. Refuses to run unless
 * ESI_LIVE_TESTS=true.
 *
 * For each recipe in recorded/catalogue.ts the real public client method is
 * called with a fetch that captures the request and stops it, so the URL and
 * headers (User-Agent, X-Compatibility-Date) are exactly what the client
 * sends. The recorder then sends that request itself, one at a time, reading
 * at most MAX_RECORDED_PAGES pages. It stops the whole run on a 420 (error
 * limited) and never retries one, waits out a 429's Retry-After once, and
 * pauses when X-ESI-Error-Limit-Remain runs low.
 *
 * A failed endpoint keeps its committed fixture. An endpoint listed in
 * fixtures/unrecordable.json that records successfully is removed from it.
 *
 * Exit codes: 0 every endpoint not listed as unrecordable was recorded;
 * 1 some were not (their committed fixtures are unchanged);
 * 2 the run could not proceed (guard, 420, spec unavailable, stale recipe).
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import requireLiveTests from '../setup/requireLiveTests';
import { EsiClient } from '../../src/EsiClient';
import { COMPATIBILITY_DATE, USER_AGENT } from '../../src/core/constants';
import {
  Ids,
  MissingId,
  PublicEndpoint,
  RECIPES,
  Recipe,
  publicGetEndpoints,
} from './recorded/catalogue';
import {
  RecordedFixture,
  RecordedPage,
  Truncation,
  fixturePath,
  keepHeaders,
  serializeFixture,
  templatePattern,
  truncateBody,
} from './recorded/fixture';
import {
  FIXTURES_DIR,
  MAX_RECORDED_PAGES,
  UNRECORDABLE_PATH,
} from './recorded/policy';
import { readReasonList } from './recorded/ratchet';
import { findSpecOperation, OpenApiSpec } from './helpers';

const BASE_URL = 'https://esi.evetech.net';
const MIN_GAP_MS = 250;
const ERROR_LIMIT_FLOOR = 20;
const MAX_ATTEMPTS = 3;

class RunAborted extends Error {}

class CapturedRequest extends Error {
  constructor(
    public readonly url: string,
    public readonly headers: Record<string, string>,
  ) {
    super('request captured');
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

async function politeFetch(
  url: string,
  headers: Record<string, string>,
): Promise<Response> {
  const wait = lastRequestAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  let response: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    lastRequestAt = Date.now();
    response = await fetch(url, {
      headers: {
        ...headers,
        // The client's own User-Agent, plus who is recording and where to reach them.
        'user-agent': `${headers['user-agent'] ?? 'esi.ts'} (contract-recorder; +https://github.com/lgriffin/ESI.ts)`,
      },
    });
    if (response.status === 420) {
      throw new RunAborted(
        `ESI answered 420 (error limited) for ${url}; stopping the run without retrying.`,
      );
    }
    const remain = Number(response.headers.get('x-esi-error-limit-remain'));
    const reset = Number(response.headers.get('x-esi-error-limit-reset'));
    if (
      response.headers.has('x-esi-error-limit-remain') &&
      remain < ERROR_LIMIT_FLOOR
    ) {
      console.warn(`  error limit low (${remain} left); pausing ${reset + 1}s`);
      await sleep((reset + 1) * 1000);
    }
    if (response.status !== 429 || attempt === 1) break;
    const retryAfter = Math.min(
      Number(response.headers.get('retry-after') ?? 60),
      120,
    );
    console.warn(`  429 rate limited; waiting ${retryAfter}s before one retry`);
    await sleep(retryAfter * 1000);
  }
  return response!;
}

/** Run the client method with a fetch that captures the request and stops it. */
async function captureRequest(
  recipe: Recipe,
  args: unknown[],
): Promise<CapturedRequest> {
  const client = new EsiClient({
    clientId: 'esi-ts-contract-recorder',
    baseUrl: BASE_URL,
    retryConfig: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1 },
    enableETagCache: false,
    enableCircuitBreaker: false,
    enableRequestDeduplication: false,
    rateLimiterConfig: { minDelayMs: 0 },
    logLevel: 'error',
  });
  const realFetch = globalThis.fetch;
  let captured: CapturedRequest | undefined;
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => (headers[k] = v));
    captured = new CapturedRequest(String(input), headers);
    throw captured;
  }) as typeof fetch;
  try {
    const domain = (
      client as unknown as Record<string, Record<string, unknown>>
    )[recipe.client];
    const method = domain?.[recipe.method];
    if (typeof method !== 'function') {
      throw new RunAborted(
        `Recipe ${recipe.endpoint} names client method ${recipe.client}.${recipe.method}, which does not exist.`,
      );
    }
    await (method as (...a: unknown[]) => Promise<unknown>)
      .apply(domain, args)
      .catch(() => undefined);
  } finally {
    globalThis.fetch = realFetch;
    client.shutdown();
  }
  if (!captured) {
    throw new Error(`${recipe.client}.${recipe.method} sent no request`);
  }
  return captured;
}

interface Outcome {
  endpoint: string;
  ok: boolean;
  reason?: string;
  bytes?: number;
}

async function recordOne(
  recipe: Recipe,
  endpoint: PublicEndpoint,
  ids: Ids,
  spec: { hash: string; doc: OpenApiSpec },
  write: boolean,
): Promise<Outcome> {
  let lastReason = 'no attempt made';
  if (recipe.prepare) {
    try {
      Object.assign(
        ids,
        await recipe.prepare(ids, async (rel) => {
          const response = await politeFetch(`${BASE_URL}/${rel}`, {
            'x-compatibility-date': COMPATIBILITY_DATE,
            'user-agent': USER_AGENT,
          });
          if (response.status !== 200) {
            throw new Error(
              `HTTP ${response.status} while preparing from ${rel}`,
            );
          }
          return response.json();
        }),
      );
    } catch (err) {
      if (err instanceof RunAborted) throw err;
      return {
        endpoint: recipe.endpoint,
        ok: false,
        reason: (err as Error).message,
      };
    }
  }
  let emptyFallback: (() => Promise<Outcome>) | undefined;
  const attempts = recipe.attempts ?? MAX_ATTEMPTS;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let args: unknown[];
    try {
      args = recipe.args(ids, attempt);
    } catch (err) {
      if (err instanceof MissingId) {
        if (emptyFallback) return emptyFallback();
        return {
          endpoint: recipe.endpoint,
          ok: false,
          reason: attempt === 0 ? err.message : lastReason,
        };
      }
      throw err;
    }

    const request = await captureRequest(recipe, args);
    const relative = request.url.slice(BASE_URL.length + 1);
    if (!templatePattern(endpoint.definition.path).test(relative)) {
      throw new RunAborted(
        `${recipe.client}.${recipe.method} requested ${relative}, which is not ${endpoint.definition.path}: the recipe maps to the wrong method.`,
      );
    }
    if (
      Object.keys(request.headers).some(
        (h) => h.toLowerCase() === 'authorization',
      )
    ) {
      throw new RunAborted(
        `${recipe.endpoint} sent an Authorization header; public recordings must not.`,
      );
    }

    const first = await politeFetch(request.url, request.headers);
    if (first.status === 204 || first.status === 404) {
      const text = await first.text().catch(() => '');
      lastReason = `HTTP ${first.status} for ${relative}${text ? `: ${text.slice(0, 120)}` : ''}`;
      continue;
    }
    if (first.status !== 200) {
      const text = await first.text().catch(() => '');
      return {
        endpoint: recipe.endpoint,
        ok: false,
        reason: `HTTP ${first.status} for ${relative}: ${text.slice(0, 120)}`,
      };
    }

    const firstBody = (await first.json()) as unknown;
    const upstreamPages = Number(first.headers.get('x-pages') ?? '1') || 1;
    const raw: Array<{ url: string; response: Response; body: unknown }> = [
      { url: relative, response: first, body: firstBody },
    ];
    for (
      let page = 2;
      page <= Math.min(upstreamPages, MAX_RECORDED_PAGES);
      page++
    ) {
      const url = `${request.url}${request.url.includes('?') ? '&' : '?'}page=${page}`;
      const response = await politeFetch(url, request.headers);
      if (response.status !== 200) {
        return {
          endpoint: recipe.endpoint,
          ok: false,
          reason: `HTTP ${response.status} for page ${page} of ${relative}`,
        };
      }
      raw.push({
        url: url.slice(BASE_URL.length + 1),
        response,
        body: await response.json(),
      });
    }

    Object.assign(ids, recipe.derive?.(firstBody, upstreamPages) ?? {});

    const truncated: Truncation[] = [];
    const pages: RecordedPage[] = raw.map((r, i) => {
      const cut = truncateBody(r.body, i + 1);
      truncated.push(...cut.truncated);
      const headers = keepHeaders(r.response.headers.entries());
      if ('x-pages' in headers) headers['x-pages'] = String(raw.length);
      return { url: r.url, status: r.response.status, headers, body: cut.body };
    });

    const op = findSpecOperation(spec.doc, endpoint.definition.path, 'GET');
    const fixture: RecordedFixture = {
      endpoint: recipe.endpoint,
      call: { client: recipe.client, method: recipe.method, args },
      recordedAt: new Date().toISOString().slice(0, 10),
      compatibilityDate:
        request.headers['x-compatibility-date'] ?? COMPATIBILITY_DATE,
      specHash: spec.hash,
      specCacheSeconds: op?.['x-cache-age'] ?? null,
      upstreamPages,
      truncated,
      pages,
    };
    const text = serializeFixture(fixture);
    const save = async (): Promise<Outcome> => {
      if (write) fs.writeFileSync(fixturePath(recipe.endpoint), text);
      return {
        endpoint: recipe.endpoint,
        ok: true,
        bytes: Buffer.byteLength(text),
      };
    };
    const empty = Array.isArray(firstBody) && firstBody.length === 0;
    if (recipe.preferNonEmpty && empty && attempt < attempts - 1) {
      emptyFallback ??= save;
      lastReason = `empty body for ${relative}`;
      continue;
    }
    return save();
  }
  if (emptyFallback) return emptyFallback();
  return { endpoint: recipe.endpoint, ok: false, reason: lastReason };
}

function option(name: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg?.slice(name.length + 3);
}

async function main(): Promise<number> {
  await requireLiveTests();
  delete process.env.ESI_ACCESS_TOKEN; // Public recordings never carry a token.

  const only = option('only')?.split(',').filter(Boolean);
  const endpoints = new Map(publicGetEndpoints().map((e) => [e.key, e]));
  const recipes = new Map(RECIPES.map((r) => [r.endpoint, r]));

  for (const recipe of RECIPES) {
    if (!endpoints.has(recipe.endpoint)) {
      console.error(
        `Recipe ${recipe.endpoint} names no public GET endpoint; remove or rename it.`,
      );
      return 2;
    }
  }

  const specUrl = `${BASE_URL}/meta/openapi.json?compatibility_date=${COMPATIBILITY_DATE}`;
  const specResponse = await fetch(specUrl);
  if (!specResponse.ok) {
    console.error(`Could not fetch ${specUrl}: HTTP ${specResponse.status}`);
    return 2;
  }
  const specText = await specResponse.text();
  const spec = {
    hash: `sha256:${createHash('sha256').update(specText).digest('hex')}`,
    doc: JSON.parse(specText) as OpenApiSpec,
  };

  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  const unrecordable = readReasonList(UNRECORDABLE_PATH);
  const outcomes: Outcome[] = [];
  const ids: Ids = {};

  for (const recipe of RECIPES) {
    const selected = !only || only.includes(recipe.endpoint);
    // A prerequisite that is not selected still runs, unwritten, for its IDs.
    if (!selected && !recipe.derive) continue;
    const outcome = await recordOne(
      recipe,
      endpoints.get(recipe.endpoint)!,
      ids,
      spec,
      selected,
    );
    if (!selected) continue;
    outcomes.push(outcome);
    console.log(
      outcome.ok
        ? `  recorded  ${outcome.endpoint} (${outcome.bytes} bytes)`
        : `  FAILED    ${outcome.endpoint}: ${outcome.reason}`,
    );
  }
  for (const key of endpoints.keys()) {
    if (!recipes.has(key) && (!only || only.includes(key))) {
      outcomes.push({
        endpoint: key,
        ok: false,
        reason: 'no recipe in tests/contract/recorded/catalogue.ts',
      });
    }
  }

  const recorded = outcomes.filter((o) => o.ok);
  const nowRecordable = recorded.filter((o) => o.endpoint in unrecordable);
  if (nowRecordable.length > 0) {
    for (const o of nowRecordable) delete unrecordable[o.endpoint];
    fs.writeFileSync(
      UNRECORDABLE_PATH,
      `${JSON.stringify(unrecordable, null, 2)}\n`,
    );
  }
  const listedFailures = outcomes.filter(
    (o) => !o.ok && o.endpoint in unrecordable,
  );
  const unlistedFailures = outcomes.filter(
    (o) => !o.ok && !(o.endpoint in unrecordable),
  );

  console.log(
    `\nRecorded ${recorded.length}; unrecordable (listed) ${listedFailures.length}; ` +
      `failed and not listed ${unlistedFailures.length}.`,
  );
  for (const o of nowRecordable)
    console.log(`  removed from unrecordable.json: ${o.endpoint}`);
  for (const o of unlistedFailures)
    console.log(`  not recorded: ${o.endpoint}: ${o.reason}`);

  const report = option('report');
  if (report) {
    fs.writeFileSync(
      report,
      `${JSON.stringify({ recorded: recorded.length, listedFailures, unlistedFailures, nowRecordable }, null, 2)}\n`,
    );
  }
  return unlistedFailures.length > 0 ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(2);
  },
);
