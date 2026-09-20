/**
 * Replay a recorded fixture through the full client pipeline.
 *
 * Mocks only at the BDD transport seam (tests/bdd/support/transport.ts): the
 * real public client method runs, with its rate limiter, retry, ETag cache,
 * deduplication, circuit breaker, pagination and Zod validation. Runs inside
 * Jest (the seam is jest-fetch-mock), with jest.contract.replay.config.cjs.
 */
import {
  createSeamClient,
  finishTransport,
  queueResponse,
  sentRequests,
  startTransport,
} from '../../bdd/support/transport';
import type { EndpointDefinition } from '../../../src/core/endpoints/EndpointDefinition';
import { lookupSpecTtl } from '../../../src/core/requestPipeline/cachePolicy';
import { EsiValidationError } from '../../../src/core/util/error';
import {
  RecordedFixture,
  keyPaths,
  mergedBody,
  templatePattern,
} from './fixture';

const BASE = 'https://esi.evetech.net/';
/** An arbitrary fixed start time; the replay moves the clock itself. */
const T0 = Date.UTC(2026, 0, 1, 12, 0, 0);

export interface ReplayReport {
  /** Set when the client rejected the recorded body. */
  rejection?: EsiValidationError;
  /** Everything else that did not hold, as sentences. */
  problems: string[];
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const exactUrl = (relative: string) =>
  new RegExp(`^${escape(BASE + relative)}$`);

/** A field ESI does not send, added to prove unknown fields survive validation. */
export const PROBE_FIELD = 'x_replay_unknown_field';

/** The body with PROBE_FIELD added to the top-level object or each top-level element object. */
function withProbe(body: unknown): unknown {
  const add = (v: unknown) =>
    v !== null && typeof v === 'object' && !Array.isArray(v)
      ? { ...(v as object), [PROBE_FIELD]: 'probe' }
      : v;
  return Array.isArray(body) ? body.map(add) : add(body);
}

function queuePages(fixture: RecordedFixture, probe = false): void {
  for (const page of fixture.pages) {
    queueResponse({
      status: page.status,
      headers: page.headers,
      // Sent verbatim, so a JSON string or number body is not re-encoded.
      body: JSON.stringify(probe ? withProbe(page.body) : page.body),
      match: exactUrl(page.url),
    });
  }
}

/** The Zod issues of a rejection as `path: message` lines. */
export function describeIssues(error: EsiValidationError): string[] {
  const issues =
    (
      error.validationError as {
        issues?: Array<{ path: PropertyKey[]; message: string }>;
      }
    )?.issues ?? [];
  return issues.map(
    (i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`,
  );
}

function keySetProblems(
  label: string,
  value: unknown,
  expected: unknown,
): string[] {
  const got = keyPaths(value);
  const want = keyPaths(expected);
  const dropped = [...want].filter((p) => !got.has(p));
  const added = [...got].filter((p) => !want.has(p));
  const out: string[] = [];
  if (dropped.length > 0) {
    out.push(
      `${label}: the client dropped keys ESI sent: ${dropped.slice(0, 10).join(', ')}`,
    );
  }
  if (added.length > 0) {
    out.push(
      `${label}: the client returned keys ESI did not send: ${added.slice(0, 10).join(', ')}`,
    );
  }
  if (
    Array.isArray(expected) &&
    (!Array.isArray(value) || value.length !== expected.length)
  ) {
    out.push(
      `${label}: expected ${expected.length} elements across the recorded pages, got ${Array.isArray(value) ? value.length : typeof value}`,
    );
  }
  return out;
}

export async function replayFixture(
  fixture: RecordedFixture,
  definition: EndpointDefinition,
): Promise<ReplayReport> {
  const problems: string[] = [];
  let now = T0;
  const clock = jest.spyOn(Date, 'now').mockImplementation(() => now);
  startTransport();
  const client = createSeamClient();

  const domain = (client as unknown as Record<string, Record<string, unknown>>)[
    fixture.call.client
  ];
  const method = domain?.[fixture.call.method];
  const call = () =>
    (method as (...a: unknown[]) => Promise<unknown>).apply(
      domain,
      fixture.call.args,
    );

  const unwrap = (v: unknown) =>
    definition.cursorPagination ? (v as { data: unknown }).data : v;
  const expected = definition.cursorPagination
    ? [mergedBody(fixture)].flat()
    : mergedBody(fixture);

  let transportError: unknown;
  try {
    if (typeof method !== 'function') {
      problems.push(
        `client.${fixture.call.client}.${fixture.call.method} does not exist; re-record the fixture or fix its call.`,
      );
      return { problems };
    }

    // 1. The recorded body passes validation and keeps its keys.
    queuePages(fixture);
    let value: unknown;
    try {
      value = await call();
    } catch (err) {
      if (err instanceof EsiValidationError)
        return { rejection: err, problems };
      throw err;
    }

    const sent = sentRequests();
    const pattern = templatePattern(definition.path);
    const firstPath = sent[0] ? sent[0].url.href.slice(BASE.length) : '(none)';
    if (!pattern.test(firstPath)) {
      problems.push(
        `request: ${fixture.call.client}.${fixture.call.method} requested ${firstPath}, which is not ${definition.path}.`,
      );
    }
    if (sent.length !== fixture.pages.length) {
      problems.push(
        `pagination: X-Pages ${fixture.pages.length} should cost ${fixture.pages.length} request(s), the client sent ${sent.length}.`,
      );
    }
    problems.push(...keySetProblems('first call', unwrap(value), expected));

    // 2. Cache headers produce the expected TTL, and revalidation sends the ETag.
    const etag = fixture.pages[0]!.headers.etag;
    const specTtlMs = (fixture.specCacheSeconds ?? 0) * 1000;
    const generatedTtlMs = lookupSpecTtl('GET', definition.path);
    const before = sent.length;

    const followUp = async (label: string): Promise<unknown> => {
      try {
        return await call();
      } catch (err) {
        problems.push(`${label}: the call failed: ${(err as Error).message}`);
        return undefined;
      }
    };

    if (etag && specTtlMs > 0) {
      now = T0 + specTtlMs - 1;
      const cached = await followUp('cached call');
      if (sentRequests().length !== before) {
        problems.push(
          `cache: within the recorded x-cache-age (${fixture.specCacheSeconds}s) the client sent a request instead of serving its cache; ` +
            `the generated TTL for ${definition.path} is ${generatedTtlMs === undefined ? 'missing' : `${generatedTtlMs / 1000}s`}.`,
        );
        return { problems };
      }
      problems.push(...keySetProblems('cached call', unwrap(cached), expected));
      now = T0 + specTtlMs + 1;
    }

    if (etag) {
      queueResponse({
        status: 304,
        headers: fixture.pages[0]!.headers,
        match: exactUrl(fixture.pages[0]!.url),
      });
    } else {
      queuePages(fixture);
    }
    const revalidated = await followUp('follow-up call');
    const after = sentRequests();
    const conditional = after[before];
    if (!conditional) {
      problems.push(
        `cache: ${etag && specTtlMs > 0 ? `after x-cache-age ${fixture.specCacheSeconds}s` : 'on the second call'} the client served its cache without a request ` +
          `(recorded x-cache-age ${fixture.specCacheSeconds ?? 'none'}s, generated TTL ${generatedTtlMs ?? 'none'}ms).`,
      );
    } else if (etag && conditional.headers['if-none-match'] !== etag) {
      problems.push(
        `cache: the follow-up request sent If-None-Match ${conditional.headers['if-none-match'] ?? '(none)'}, expected the recorded ETag ${etag}.`,
      );
    } else if (!etag && conditional.headers['if-none-match'] !== undefined) {
      problems.push(
        `cache: ESI sent no ETag, yet the follow-up request sent If-None-Match ${conditional.headers['if-none-match']}.`,
      );
    }
    if (revalidated !== undefined) {
      problems.push(
        ...keySetProblems('follow-up call', unwrap(revalidated), expected),
      );
    }

    // 3. A field ESI adds tomorrow survives validation (loose objects), on a fresh client.
    const expectedProbe = withProbe(expected);
    if (keyPaths(expectedProbe).size !== keyPaths(expected).size) {
      const probeClient = createSeamClient();
      const probeDomain = (
        probeClient as unknown as Record<string, Record<string, unknown>>
      )[fixture.call.client]!;
      queuePages(fixture, true);
      try {
        const probed = await (
          probeDomain[fixture.call.method] as (
            ...a: unknown[]
          ) => Promise<unknown>
        ).apply(probeDomain, fixture.call.args);
        problems.push(
          ...keySetProblems('unknown field', unwrap(probed), expectedProbe).map(
            (p) =>
              `${p} (the schema strips fields ESI may add; use z.looseObject)`,
          ),
        );
      } catch (err) {
        problems.push(
          `unknown field: adding ${PROBE_FIELD} to the recorded body made the call fail (${(err as Error).message}); the schema rejects fields ESI may add.`,
        );
      } finally {
        probeClient.shutdown();
      }
    }
    return { problems };
  } finally {
    clock.mockRestore();
    client.shutdown();
    try {
      finishTransport();
    } catch (err) {
      transportError = err;
    }
    if (transportError)
      problems.push(String((transportError as Error).message));
  }
}
