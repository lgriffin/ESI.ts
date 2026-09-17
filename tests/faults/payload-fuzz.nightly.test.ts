/**
 * Nightly payload fuzz: every endpoint definition in src/core/endpoints with a
 * responseSchema, served bodies generated from that schema and then mutated
 * at one point, through the real pipeline.
 *
 * For each generated body the endpoint must resolve with exactly that body.
 * For each mutation:
 * - drop a required field, wrong type, or null where the schema allows none:
 *   the call rejects with EsiValidationError (status 0, direction response,
 *   message naming the URL) carrying exactly one Zod issue, at the mutated
 *   path, after exactly one request. Nothing else may be thrown.
 * - an unknown field: the call resolves with the field preserved.
 *
 * Seeded: the seed is printed; FAULTS_SEED replays a run, FAULTS_RUNS sets the
 * cases per endpoint (default 100). See tests/faults/AGENTS.md.
 */
import { readdirSync } from 'fs';
import * as path from 'path';
import * as fc from 'fast-check';
import fetchMock from 'jest-fetch-mock';
import { z } from 'zod';
import { ApiClient } from '../../src/core/ApiClient';
import { configureApiClient } from '../../src/core/configureApiClient';
import { createClient } from '../../src/core/endpoints/createClient';
import type {
  EndpointDefinition,
  EndpointMap,
} from '../../src/core/endpoints/EndpointDefinition';
import { createNoopLogger } from '../../src/core/logger/NoopLogger';
import { EsiError, EsiValidationError } from '../../src/core/util/error';
import {
  drainTransport,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../bdd/support/transport';
import { assertThat } from '../support/assertions';
import {
  UNKNOWN_FIELD,
  applyMutation,
  arbitraryFor,
  formatPath,
  mutationsFor,
} from './zodArbitrary';

fetchMock.enableMocks();

const ENDPOINTS_DIR = path.join(
  __dirname,
  '..',
  '..',
  'src',
  'core',
  'endpoints',
);

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer, got "${raw}"`);
  }
  return value;
}

// An unseeded night picks its own seed, so each run explores different bodies;
// it is printed below and FAULTS_SEED replays it. Math.random is the right
// source for that: nothing here is a security decision.
const SEED = readInt('FAULTS_SEED', Math.floor(Math.random() * 2 ** 31));
const RUNS = readInt('FAULTS_RUNS', 100);

interface Case {
  name: string;
  def: EndpointDefinition & { responseSchema: z.ZodType };
}

/** Every endpoint map exported by src/core/endpoints/*Endpoints.ts. */
function discoverEndpoints(): Case[] {
  const files = readdirSync(ENDPOINTS_DIR).filter((f) =>
    /Endpoints\.ts$/.test(f),
  );
  if (files.length === 0) {
    throw new Error(`No *Endpoints.ts files found in ${ENDPOINTS_DIR}`);
  }
  const cases: Case[] = [];
  for (const file of files) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path.join(ENDPOINTS_DIR, file)) as Record<
      string,
      EndpointMap
    >;
    for (const [exportName, map] of Object.entries(mod)) {
      for (const [method, def] of Object.entries(map)) {
        if (!def || typeof def !== 'object' || !('path' in def)) continue;
        if (!def.responseSchema) continue;
        cases.push({
          name: `${exportName}.${method}`,
          def: def as Case['def'],
        });
      }
    }
  }
  return cases;
}

const CASES = discoverEndpoints();

function fuzzClient(def: EndpointDefinition) {
  const api = new ApiClient(
    'faults-nightly',
    'https://esi.evetech.net',
    'faults-access-token',
  );
  configureApiClient(api, {
    retryConfig: { maxRetries: 0 },
    rateLimiterConfig: { minDelayMs: 0 },
    enableETagCache: false,
    logger: createNoopLogger(),
  });
  const methods = createClient(api, { target: def });
  const args: unknown[] = [
    ...(def.pathParams ?? []).map((_, i) => 90000001 + i),
    ...Object.keys(def.queryParams ?? {}).map(() => undefined),
    ...(def.bodyBuilder || def.hasBody ? [[30000142, 60003760]] : []),
  ];
  return {
    call: () =>
      (methods.target as (...a: unknown[]) => Promise<unknown>)(...args),
    shutdown: () => api.getCache()?.clear(),
  };
}

const canon = (v: unknown): string => JSON.stringify(v);

/** Run one exchange; return the settled outcome and the requests it sent. */
async function serve(def: EndpointDefinition, body: unknown) {
  const before = sentRequests().length;
  queueResponse({
    status: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const client = fuzzClient(def);
  const settled = await client.call().then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  client.shutdown();
  const leftovers = drainTransport();
  return {
    settled,
    requests: sentRequests().length - before,
    leftovers,
  };
}

function reproduce(name: string): string {
  return `Reproduce: FAULTS_SEED=${SEED} FAULTS_RUNS=${RUNS} npx jest --config jest.faults.nightly.config.cjs -t "${name}$"`;
}

describe(`Nightly payload fuzz (seed ${SEED}, ${RUNS} runs per endpoint)`, () => {
  useHttpTransport();

  beforeAll(() => {
    // Printed so a failing night can be replayed exactly.
    process.stdout.write(
      `payload fuzz: seed ${SEED}, ${RUNS} runs per endpoint, ${CASES.length} endpoints\n`,
    );
  });

  it('discovers every endpoint definition with a response schema', () => {
    expect(CASES.length).toBeGreaterThan(200);
  });

  it.each(CASES)('$name', async ({ name, def }) => {
    const schema = def.responseSchema;
    const bodies = arbitraryFor(schema);
    const withMutation = bodies.chain((body) => {
      const mutations = mutationsFor(schema, body);
      return fc.record({
        body: fc.constant(body),
        mutation: fc.constantFrom(...mutations),
      });
    });

    const details = await fc.check(
      fc.asyncProperty(withMutation, async ({ body, mutation }) => {
        const where = `${name}: ${mutation.kind} at ${formatPath(mutation.path)}`;

        // The generated body is valid and comes back unchanged.
        if (!schema.safeParse(body).success) {
          throw new Error(
            `${name}: the generator produced a body the schema rejects (a bug in tests/faults/zodArbitrary.ts): ${canon(body)}`,
          );
        }
        const clean = await serve(def, body);
        if (!clean.settled.ok) {
          throw new Error(
            `${name}: a schema-valid body was rejected with ${String(clean.settled.error)}`,
          );
        }
        if (canon(clean.settled.value) !== canon(body)) {
          throw new Error(
            `${name}: a schema-valid body came back changed: sent ${canon(body)}, got ${canon(clean.settled.value)}`,
          );
        }

        const mutated = applyMutation(schema, body, mutation);
        const seen = await serve(def, mutated);
        if (seen.requests !== 1 || seen.leftovers.unrequested.length > 0) {
          throw new Error(
            `${where}: expected exactly 1 request, the client sent ${seen.requests}`,
          );
        }

        if (mutation.kind === 'unknown-field') {
          if (!seen.settled.ok) {
            throw new Error(
              `${where}: invariant "unknown fields are preserved" broke: the call rejected with ${String(seen.settled.error)}`,
            );
          }
          if (canon(seen.settled.value) !== canon(mutated)) {
            throw new Error(
              `${where}: invariant "unknown fields are preserved" broke: sent ${canon(mutated)}, got ${canon(seen.settled.value)} (is the schema z.object instead of z.looseObject?)`,
            );
          }
          if (!canon(seen.settled.value).includes(UNKNOWN_FIELD)) {
            throw new Error(`${where}: the unknown field is missing`);
          }
          return;
        }

        if (seen.settled.ok) {
          throw new Error(
            `${where}: invariant "invalid bodies raise EsiValidationError" broke: the call resolved with ${canon(seen.settled.value)} for ${canon(mutated)}`,
          );
        }
        const error = seen.settled.error;
        if (!(error instanceof EsiValidationError)) {
          const kind =
            error instanceof EsiError
              ? `EsiError ${error.statusCode}`
              : error instanceof Error
                ? error.constructor.name
                : typeof error;
          throw new Error(
            `${where}: invariant "invalid bodies raise EsiValidationError and nothing else" broke: got ${kind}: ${String((error as Error)?.message ?? error)}`,
          );
        }
        const issues = (error.validationError as z.ZodError).issues;
        const url = error.url ?? '';
        const problems: string[] = [];
        if (error.statusCode !== 0)
          problems.push(`statusCode ${error.statusCode}`);
        if (error.direction !== 'response')
          problems.push(`direction ${error.direction}`);
        if (!url.startsWith('https://esi.evetech.net/'))
          problems.push(`url "${url}"`);
        if (error.message !== `Response validation failed for ${url}`) {
          problems.push(`message "${error.message}"`);
        }
        if (
          issues.length !== 1 ||
          canon(issues[0]!.path) !== canon(mutation.path)
        ) {
          problems.push(
            `issues ${canon(issues.map((i) => ({ path: i.path, code: i.code })))} (expected one at ${canon(mutation.path)})`,
          );
        }
        if (problems.length > 0) {
          throw new Error(
            `${where}: the EsiValidationError does not locate the fault: ${problems.join('; ')}`,
          );
        }
      }),
      { seed: SEED, numRuns: RUNS, endOnFailure: true },
    );
    const broke = (details.errorInstance as { message?: unknown } | null)
      ?.message;
    assertThat(
      !details.failed,
      [
        String(broke ?? 'the property failed'),
        `Counterexample: ${canon(details.counterexample)}`,
        reproduce(name),
      ].join('\n'),
    );
  });
});
