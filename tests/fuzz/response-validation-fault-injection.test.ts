/**
 * Runtime-validation fault injection.
 *
 * Generates ESI response bodies that violate an endpoint's `responseSchema`
 * and serves them through the BDD transport seam (`tests/bdd/support/`), so
 * each one travels the real pipeline: rate limiter, retry, deduplication,
 * circuit breaker, ETag cache, JSON parsing and then validation in
 * `createClient`. Nothing between the client method and `fetch` is stubbed.
 *
 * The existing unit tests build `EsiValidationError` by hand or parse schemas
 * directly; this suite checks what a consumer actually receives when ESI
 * sends a body the library does not expect.
 */
import fetchMock from 'jest-fetch-mock';
import * as fc from 'fast-check';
import { z } from 'zod';

import {
  EsiError,
  EsiValidationError,
  isValidationError,
} from '../../src/core/util/error';
import { EsiClient } from '../../src/EsiClient';
import { characterEndpoints } from '../../src/core/endpoints/characterEndpoints';
import { marketEndpoints } from '../../src/core/endpoints/marketEndpoints';
import { statusEndpoints } from '../../src/core/endpoints/statusEndpoints';
import {
  createSeamClient,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../bdd/support/transport';

// jest.fuzz.config.cjs has no setup file; the seam drives the global mock.
fetchMock.enableMocks();

type Json = z.infer<ReturnType<typeof z.json>>;

interface Target {
  name: string;
  /** Path the request must hit, used to check the error's URL. */
  path: string;
  schema: z.ZodType;
  valid: Json;
  call: (client: EsiClient) => Promise<unknown>;
  callSafe: (
    client: EsiClient,
  ) => Promise<{ ok: true; data: unknown } | { ok: false; error: EsiError }>;
}

const CHARACTER_ID = 2112625428;

const TARGETS: Target[] = [
  {
    name: 'status.getStatus (object)',
    path: '/status',
    schema: statusEndpoints.getStatus.responseSchema,
    valid: {
      players: 23456,
      server_version: '2890123',
      start_time: '2026-09-16T11:02:00Z',
      vip: false,
    },
    call: (c) => c.status.getStatus(),
    callSafe: (c) => c.status.withSafeMode().getStatus(),
  },
  {
    name: 'market.getMarketPrices (array)',
    path: '/markets/prices/',
    schema: marketEndpoints.getMarketPrices.responseSchema,
    valid: [
      { type_id: 34, average_price: 5.12, adjusted_price: 5.01 },
      { type_id: 35, average_price: 11.4 },
      { type_id: 36 },
    ],
    call: (c) => c.market.getMarketPrices(),
    callSafe: (c) => c.market.withSafeMode().getMarketPrices(),
  },
  {
    name: 'characters.getCharacterPublicInfo (object, path parameter)',
    path: `/characters/${CHARACTER_ID}/`,
    schema: characterEndpoints.getCharacterPublicInfo.responseSchema,
    valid: {
      name: 'Fuzz Pilot',
      corporation_id: 98000001,
      birthday: '2015-03-24T11:37:00Z',
      bloodline_id: 4,
      race_id: 1,
      gender: 'female',
      security_status: -1.5,
    },
    call: (c) => c.characters.getCharacterPublicInfo(CHARACTER_ID),
    callSafe: (c) =>
      c.characters.withSafeMode().getCharacterPublicInfo(CHARACTER_ID),
  },
];

/** What the client sees after JSON transport: -0 becomes 0, and so on. */
const overTheWire = (value: Json): unknown =>
  JSON.parse(JSON.stringify(value)) as unknown;

const json = fc.jsonValue({ maxDepth: 3 }) as fc.Arbitrary<Json>;

/** One field of an object replaced by arbitrary JSON, or removed. */
function corruptObject(base: Record<string, Json>): fc.Arbitrary<Json> {
  const keys = Object.keys(base);
  return fc
    .record({
      key: fc.constantFrom(...keys),
      replacement: fc.option(json, { nil: undefined }),
    })
    .map(({ key, replacement }) => {
      const copy: Record<string, Json> = { ...base };
      if (replacement === undefined) delete copy[key];
      else copy[key] = replacement;
      return copy;
    });
}

/**
 * Bodies that break the schema: a corrupted field (in one element, for an
 * array), or a body of the wrong shape entirely. Every candidate is kept only
 * if the endpoint's own schema rejects it after a JSON round trip.
 */
function invalidBodies(target: Target): fc.Arbitrary<Json> {
  const corrupted = Array.isArray(target.valid)
    ? fc
        .record({
          index: fc.nat({ max: target.valid.length - 1 }),
          element: fc
            .constantFrom(...target.valid)
            .chain((e) => corruptObject(e as Record<string, Json>)),
        })
        .map(({ index, element }) => {
          const copy = [...(target.valid as Json[])];
          copy[index] = element;
          return copy as Json;
        })
    : corruptObject(target.valid as Record<string, Json>);

  return fc
    .oneof({ arbitrary: corrupted, weight: 3 }, { arbitrary: json, weight: 1 })
    .filter((body) => !target.schema.safeParse(overTheWire(body)).success);
}

const issueShapes = (error: z.ZodError) =>
  error.issues.map(({ code, path }) => ({ code, path }));

/** Serve the body as ESI would: JSON, 200, with an ETag so it is cacheable. */
function serve(body: Json): void {
  queueResponse({
    status: 200,
    headers: { 'content-type': 'application/json', etag: '"fuzz"' },
    body: JSON.stringify(body),
  });
}

async function withClient<T>(
  config: Parameters<typeof createSeamClient>[0],
  use: (client: EsiClient) => Promise<T>,
): Promise<T> {
  const client = createSeamClient(config);
  try {
    return await use(client);
  } finally {
    client.shutdown();
  }
}

/** Let any promise that is going to reject unhandled do so before we look. */
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

const RUNS = { numRuns: 40 };

describe('Response validation fault injection (through the transport seam)', () => {
  useHttpTransport();

  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => unhandled.push(reason);
  beforeAll(() => process.on('unhandledRejection', onUnhandled));
  afterAll(() => process.off('unhandledRejection', onUnhandled));
  beforeEach(() => {
    unhandled.length = 0;
  });
  afterEach(async () => {
    await settle();
    expect(unhandled).toEqual([]);
  });

  describe.each(TARGETS)('$name', (target) => {
    it('accepts the valid body the generators start from', async () => {
      serve(target.valid);
      await withClient({}, async (client) => {
        await expect(target.call(client)).resolves.toEqual(target.valid);
      });
    });

    it('rejects every schema-violating body with an EsiValidationError carrying the schema issues', async () => {
      await fc.assert(
        fc.asyncProperty(invalidBodies(target), async (body) => {
          const before = sentRequests().length;
          serve(body);

          const error = await withClient({}, (client) =>
            target.call(client).then(
              (value) => {
                throw new Error(
                  `resolved with ${JSON.stringify(value)} for an invalid body`,
                );
              },
              (err: unknown) => err,
            ),
          );

          expect(error).toBeInstanceOf(EsiValidationError);
          expect(error).toBeInstanceOf(EsiError);
          expect(isValidationError(error)).toBe(true);
          const e = error as EsiValidationError;
          expect(e.name).toBe('EsiValidationError');
          expect(e.direction).toBe('response');
          expect(e.statusCode).toBe(0);
          expect(e.url).toBe(`https://esi.evetech.net${target.path}`);
          expect(e.message).toBe(`Response validation failed for ${e.url}`);

          // The error carries exactly the endpoint schema's verdict. Messages
          // are left out: the body parsed by fetch's Response lives in Node's
          // realm, not Jest's, so Zod names its type "Object", not "object".
          const expected = target.schema.safeParse(overTheWire(body));
          expect(e.validationError).toBeInstanceOf(z.ZodError);
          expect(issueShapes(e.validationError as z.ZodError)).toEqual(
            issueShapes(expected.error!),
          );

          // A validation failure is not an HTTP failure: no retry.
          expect(sentRequests().length - before).toBe(1);
        }),
        RUNS,
      );
    });

    it('returns the same failure as a value in safe mode instead of rejecting', async () => {
      await fc.assert(
        fc.asyncProperty(invalidBodies(target), async (body) => {
          serve(body);
          const result = await withClient({}, (client) =>
            target.callSafe(client),
          );
          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error).toBeInstanceOf(EsiValidationError);
          expect((result.error as EsiValidationError).direction).toBe(
            'response',
          );
        }),
        RUNS,
      );
    });

    it('passes the same bodies through unchanged when validateResponse is off', async () => {
      await fc.assert(
        fc.asyncProperty(invalidBodies(target), async (body) => {
          serve(body);
          const value = await withClient(
            { validateResponse: false },
            (client) => target.call(client),
          );
          expect(value).toEqual(overTheWire(body));
        }),
        RUNS,
      );
    });
  });
});
