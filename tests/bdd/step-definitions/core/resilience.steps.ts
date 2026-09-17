import { defineFeature, loadFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import {
  CircuitBreaker,
  CircuitOpenError,
} from '../../../../src/core/circuitBreaker/CircuitBreaker';
import {
  RetryStrategy,
  RetryContext,
} from '../../../../src/core/RetryStrategy';
import { ApiClient } from '../../../../src/core/ApiClient';
import { configureApiClient } from '../../../../src/core/configureApiClient';
import { RateLimiter } from '../../../../src/core/rateLimiter/RateLimiter';
import { EsiError, TimeoutError } from '../../../../src/core/util/error';
import { StatusClient } from '../../../../src/clients/StatusClient';
import { EsiClient, EsiClientConfig } from '../../../../src/EsiClient';
import {
  SEAM_RETRY,
  createSeamClient,
  queueError,
  queueResponse,
  sentRequests,
  useHttpTransport,
} from '../../support/transport';

const feature = loadFeature('tests/bdd/features/core/0051-resilience.feature');

// ---------------------------------------------------------------------------
// Fixtures and client construction for the HTTP-driven Rules
// ---------------------------------------------------------------------------

const STATUS_PATH = 'status';
const NAMES_PATH = 'universe/names';
const DOGMA_ATTRIBUTES_PATH = 'dogma/attributes';

const FIRST_PAYLOAD = {
  players: 20000,
  server_version: '2890156',
  start_time: '2026-09-16T11:00:00Z',
  vip: false,
};
const RETRY_PAYLOAD = { ...FIRST_PAYLOAD, players: 24000 };
const RESOLVED_NAMES = [
  { id: 95465499, name: 'CCP Bartender', category: 'character' },
];
const DOGMA_ATTRIBUTE_IDS = [2, 3, 4];
const HTML_ERROR_PAGE =
  '<html><head><title>Error</title></head><body>upstream failed</body></html>';

const NO_RETRIES = { maxRetries: 0 };

type Outcome = PromiseSettledResult<unknown>;

const settle = async (call: Promise<unknown>): Promise<Outcome> =>
  (await Promise.allSettled([call]))[0]!;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A seam client whose circuit breaker opens after `threshold` failures. */
function circuitClient(
  threshold: number,
  config: EsiClientConfig = {},
): EsiClient {
  return createSeamClient({
    enableCircuitBreaker: true,
    circuitBreakerConfig: {
      failureThreshold: threshold,
      resetTimeoutMs: 60_000,
    },
    retryConfig: NO_RETRIES,
    ...config,
  });
}

/**
 * The request pipeline without EsiClient's rate limiter: the same
 * configureApiClient wiring, with the rate limiter swapped for one in test
 * mode, so a 420 or 429 is retried without the 60-second group block.
 */
function statusClientWithTestModeRateLimiter(): StatusClient {
  const api = new ApiClient(
    'bdd-resilience',
    'https://esi.evetech.net',
    'bdd-access-token',
  );
  configureApiClient(api, { retryConfig: SEAM_RETRY, logLevel: 'error' });
  const limiter = new RateLimiter({ minDelayMs: 0 });
  limiter.setTestMode(true);
  api.setRateLimiter(limiter);
  return new StatusClient(api);
}

/** Every fetch the client made, whether or not the seam served it. */
const requestsSent = (): number => fetchMock.mock.calls.length;

/**
 * Hold the next request until the client aborts it, then reject with an
 * AbortError the way Node's fetch does. The seam's delayMs cannot stand in for
 * a timeout under Jest: jest-fetch-mock rejects an aborted request with a
 * DOMException from outside the test module realm, which the pipeline's
 * `instanceof Error` check does not recognise.
 */
function holdNextRequestUntilAborted(): void {
  fetchMock.mockImplementationOnce(
    (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const aborted = new Error('The operation was aborted.');
          aborted.name = 'AbortError';
          reject(aborted);
        });
      }),
  );
}

function expectEsiError(outcome: Outcome | undefined, status: number): void {
  expect(outcome?.status).toBe('rejected');
  const reason = (outcome as PromiseRejectedResult).reason as unknown;
  expect(reason).toBeInstanceOf(EsiError);
  expect((reason as EsiError).statusCode).toBe(status);
}

function expectCircuitOpen(outcome: Outcome | undefined): void {
  expect(outcome?.status).toBe('rejected');
  expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(
    CircuitOpenError,
  );
}

function expectResolvedWith(outcome: Outcome | undefined, value: unknown) {
  expect(outcome?.status).toBe('fulfilled');
  expect((outcome as PromiseFulfilledResult<unknown>).value).toEqual(value);
}

function circuitState(client: EsiClient, path: string): string | undefined {
  return client.getCircuitBreakerStats()?.circuits[path]?.state;
}

defineFeature(feature, (test) => {
  useHttpTransport();

  // ── Strategies exercised directly ──────────────────────────────────

  test('Third consecutive 503 opens a circuit with a threshold of three', ({
    given,
    when,
    then,
  }) => {
    let cb: CircuitBreaker;

    given('a client with circuit breaker enabled', () => {
      cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30000 });
    });

    given('the endpoint fails with 503 errors', () => {
      // failures will be recorded in the when step
    });

    when('the client makes requests until the circuit opens', () => {
      cb.recordFailure('test/endpoint', 503);
      cb.recordFailure('test/endpoint', 503);
      cb.recordFailure('test/endpoint', 503);
    });

    then('the circuit breaker shall be in the open state', () => {
      expect(cb.getState('test/endpoint')).toBe('open');
      expect(() => cb.checkCircuit('test/endpoint')).toThrow(CircuitOpenError);
    });
  });

  test('Probe succeeding after the reset timeout closes the circuit', ({
    given,
    when,
    then,
  }) => {
    let cb: CircuitBreaker;

    given('a client with circuit breaker in open state', () => {
      cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
      cb.recordFailure('test/endpoint', 503);
      cb.recordFailure('test/endpoint', 503);
      expect(cb.getState('test/endpoint')).toBe('open');
    });

    when(
      'the cooldown period expires and a probe request succeeds',
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        cb.checkCircuit('test/endpoint');
        cb.recordSuccess('test/endpoint');
      },
    );

    then('the circuit breaker shall transition to closed state', () => {
      expect(cb.getState('test/endpoint')).toBe('closed');
    });
  });

  test('Persistent 503 runs three attempts and rethrows the 503', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let caughtError: any;
    let callCount = 0;

    given('a client with retry configured for 2 attempts', () => {
      strategy = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
      });
    });

    given('the endpoint always returns 503', () => {
      // operation is configured in the when step
    });

    when('the client makes a request', async () => {
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(
          new EsiError(503, 'Service Unavailable', 'test/endpoint'),
        );
      });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
        retryOperation: jest.fn(),
      };
      try {
        await strategy.execute(operation, context);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a 503 error after all retries', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(503);
      expect(callCount).toBe(3);
    });
  });

  test('Second attempt succeeds after a 503 on the first', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let result: any;

    given('a client with retry configured for 2 attempts', () => {
      strategy = new RetryStrategy({
        maxRetries: 2,
        baseDelayMs: 1,
        maxDelayMs: 10,
      });
    });

    given('the endpoint fails once then succeeds', () => {
      // configured in the when step
    });

    when('the client makes a request', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(503, 'Service Unavailable', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'success' });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
        retryOperation: jest.fn(),
      };
      result = await strategy.execute(operation, context);
    });

    then('the client shall return the successful response', () => {
      expect(result).toEqual({ data: 'success' });
    });
  });

  test('401 on an authenticated endpoint is replayed after refreshing', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let result: any;

    given('a client with a token provider', () => {
      strategy = new RetryStrategy();
    });

    given('the endpoint returns 401 then succeeds after token refresh', () => {
      // configured in the when step
    });

    when('the client makes an authenticated request', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(
          new EsiError(401, 'Unauthorized', 'test/endpoint'),
        )
        .mockResolvedValueOnce({ data: 'authed' });
      const refreshToken = jest.fn().mockResolvedValue(undefined);
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: true,
        refreshToken,
      };
      result = await strategy.execute(operation, context);
    });

    then('the client shall return the response after token refresh', () => {
      expect(result).toEqual({ data: 'authed' });
    });
  });

  test('Rejecting refresh callback surfaces a token refresh failure', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let caughtError: any;

    given('a client with a failing token provider', () => {
      strategy = new RetryStrategy();
    });

    given('the endpoint returns 401', () => {
      // configured in the when step
    });

    when('the client makes an authenticated request', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new EsiError(401, 'Unauthorized', 'test/endpoint'));
      const refreshToken = jest
        .fn()
        .mockRejectedValue(new Error('Token expired'));
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: true,
        refreshToken,
        retryOperation: jest.fn(),
      };
      try {
        await strategy.execute(operation, context);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a token refresh failed error', () => {
      expect(caughtError).toBeDefined();
      expect(caughtError.message).toContain('Token refresh failed');
    });
  });

  test('404 is rethrown after a single attempt despite maxRetries of three', ({
    given,
    when,
    then,
  }) => {
    let strategy: RetryStrategy;
    let caughtError: any;
    let callCount = 0;

    given('a client with retry configured for 3 attempts', () => {
      strategy = new RetryStrategy({
        maxRetries: 3,
        baseDelayMs: 1,
      });
    });

    given('the endpoint returns 404', () => {
      // configured in the when step
    });

    when('the client makes a request', async () => {
      const operation = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new EsiError(404, 'Not Found', 'test/endpoint'));
      });
      const context: RetryContext = {
        endpoint: 'test/endpoint',
        method: 'GET',
        requiresAuth: false,
        retryOperation: jest.fn(),
      };
      try {
        await strategy.execute(operation, context);
      } catch (e) {
        caughtError = e;
      }
    });

    then('the client shall throw a 404 error without retrying', () => {
      expect(caughtError).toBeInstanceOf(EsiError);
      expect((caughtError as EsiError).statusCode).toBe(404);
      expect(callCount).toBe(1);
    });
  });

  // ── Typed errors reaching the caller, over HTTP ────────────────────

  test('429 response reaches the caller as an EsiError with status 429', ({
    given,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client configured for the status endpoint', () => {
      client = createSeamClient({ retryConfig: NO_RETRIES });
    });

    given('the server returns 429 Too Many Requests', () => {
      queueError(429, 'Too many errors', { match: STATUS_PATH });
    });

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client shall throw a 429 rate limit error', () => {
      expectEsiError(outcome, 429);
      expect(requestsSent()).toBe(1);
    });
  });

  test('HTTP <status> without a reason phrase is named in the error', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client configured for the status endpoint', () => {
      client = createSeamClient({ retryConfig: NO_RETRIES });
    });

    and(
      /^ESI answers the server status request with HTTP (\d+), no reason phrase and an HTML page$/,
      (status: string) => {
        queueResponse({
          status: Number(status),
          headers: { 'content-type': 'text/html' },
          body: HTML_ERROR_PAGE,
          match: STATUS_PATH,
        });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+) and the message "(.+)"$/,
      (status: string, message: string) => {
        expectEsiError(outcome, Number(status));
        expect(
          ((outcome as PromiseRejectedResult).reason as Error).message,
        ).toBe(message);
        expect(requestsSent()).toBe(1);
      },
    );
  });

  test('Unresponsive endpoint reaches the caller as a TimeoutError', ({
    given,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client configured with a short timeout', () => {
      client = createSeamClient({ timeout: 50, retryConfig: NO_RETRIES });
    });

    given('the endpoint does not respond in time', () => {
      holdNextRequestUntilAborted();
    });

    when('the client makes a request', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client shall throw a timeout error', () => {
      expect(requestsSent()).toBe(1);
      expect(outcome.status).toBe('rejected');
      expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(
        TimeoutError,
      );
    });
  });

  test('A body that stops arriving after the headers reaches the caller as a TimeoutError', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client configured with a short timeout', () => {
      client = createSeamClient({ timeout: 50, retryConfig: NO_RETRIES });
    });

    and(
      'the endpoint sends its headers and then stops sending the body',
      () => {
        queueResponse({
          body: FIRST_PAYLOAD,
          match: STATUS_PATH,
          fault: { kind: 'body-stall', bytes: 12 },
        });
      },
    );

    when('the client makes a request', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client shall throw a timeout error', () => {
      expect(requestsSent()).toBe(1);
      expect(outcome.status).toBe('rejected');
      expect((outcome as PromiseRejectedResult).reason).toBeInstanceOf(
        TimeoutError,
      );
    });
  });

  // ── Retry classes ──────────────────────────────────────────────────

  test('HTTP <status> on the first attempt is retried', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client with retries enabled', () => {
      client = createSeamClient();
    });

    and(
      /^ESI answers the first server status request with HTTP (\d+) and the retry with a payload$/,
      (status: string) => {
        queueError(Number(status), 'transient', { match: STATUS_PATH });
        queueResponse({ body: RETRY_PAYLOAD, match: STATUS_PATH });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client resolves with the payload from the retry', () => {
      expectResolvedWith(outcome, RETRY_PAYLOAD);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('HTTP <status> on the first attempt is retried once the rate limiter allows it', ({
    given,
    and,
    when,
    then,
  }) => {
    let statusClient: StatusClient;
    let outcome: Outcome;

    given(
      'a request pipeline with retries enabled and its rate limiter in test mode',
      () => {
        statusClient = statusClientWithTestModeRateLimiter();
      },
    );

    and(
      /^ESI answers the first server status request with HTTP (\d+) and the retry with a payload$/,
      (status: string) => {
        queueError(Number(status), 'throttled', { match: STATUS_PATH });
        queueResponse({ body: RETRY_PAYLOAD, match: STATUS_PATH });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(statusClient.getStatus());
    });

    then('the client resolves with the payload from the retry', () => {
      expectResolvedWith(outcome, RETRY_PAYLOAD);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('A connection reset part way through the body is retried', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client with retries enabled', () => {
      client = createSeamClient();
    });

    and(
      'ESI resets the connection part way through the first server status body and answers the retry with a payload',
      () => {
        queueResponse({
          body: FIRST_PAYLOAD,
          match: STATUS_PATH,
          fault: { kind: 'body-error', code: 'ECONNRESET', bytes: 12 },
        });
        queueResponse({ body: RETRY_PAYLOAD, match: STATUS_PATH });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client resolves with the payload from the retry', () => {
      expectResolvedWith(outcome, RETRY_PAYLOAD);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('A timed-out first attempt is retried', ({ given, and, when, then }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client with retries enabled and a 50 millisecond timeout', () => {
      client = createSeamClient({ timeout: 50 });
    });

    and(
      'ESI holds the first server status request past the timeout and answers the retry at once',
      () => {
        holdNextRequestUntilAborted();
        queueResponse({ body: RETRY_PAYLOAD, match: STATUS_PATH });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client resolves with the payload from the retry', () => {
      expectResolvedWith(outcome, RETRY_PAYLOAD);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('HTTP <status> is rejected without a retry', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client with retries enabled', () => {
      client = createSeamClient();
    });

    and(
      /^ESI answers the server status request with HTTP (\d+)$/,
      (status: string) => {
        queueError(Number(status), 'not retryable', { match: STATUS_PATH });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(outcome, Number(status));
      },
    );

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('A name resolution POST answered with 503 is not retried', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client with retries enabled', () => {
      client = createSeamClient();
    });

    and('ESI answers the name resolution request with HTTP 503', () => {
      queueError(503, 'unavailable', { match: NAMES_PATH });
    });

    when('the client posts identifiers for name resolution', async () => {
      outcome = await settle(
        client.universe.postNamesAndCategories([RESOLVED_NAMES[0]!.id]),
      );
    });

    then(
      /^the client rejects with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expectEsiError(outcome, Number(status));
      },
    );

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
      expect(sentRequests()[0]!.method).toBe('POST');
    });
  });

  test('A name resolution POST answered with 503 is retried when mutations may be retried', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given('a client with retries enabled for mutations', () => {
      client = createSeamClient({
        retryConfig: { ...SEAM_RETRY, retryMutations: true },
      });
    });

    and(
      'ESI answers the first name resolution request with HTTP 503 and the retry with names',
      () => {
        queueError(503, 'unavailable', { match: NAMES_PATH });
        queueResponse({ body: RESOLVED_NAMES, match: NAMES_PATH });
      },
    );

    when('the client posts identifiers for name resolution', async () => {
      outcome = await settle(
        client.universe.postNamesAndCategories([RESOLVED_NAMES[0]!.id]),
      );
    });

    then('the client resolves with the names from the retry', () => {
      expectResolvedWith(outcome, RESOLVED_NAMES);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  // ── Circuit states ─────────────────────────────────────────────────

  test('A call after the failure threshold is refused without a request', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    const outcomes: Outcome[] = [];

    given(
      /^a client whose circuit breaker opens after (\d+) failures?, with no retries$/,
      (threshold: string) => {
        client = circuitClient(Number(threshold));
      },
    );

    and(
      /^ESI answers the server status request with HTTP (\d+) (\d+) times$/,
      (status: string, times: string) => {
        queueError(Number(status), 'unavailable', {
          match: STATUS_PATH,
          times: Number(times),
        });
      },
    );

    when(
      /^the client requests the server status (\d+) times$/,
      async (times: string) => {
        for (let i = 0; i < Number(times); i++) {
          outcomes.push(await settle(client.status.getStatus()));
        }
      },
    );

    then(
      /^the first (\d+) calls reject with an EsiError carrying status (\d+)$/,
      (count: string, status: string) => {
        for (const outcome of outcomes.slice(0, Number(count))) {
          expectEsiError(outcome, Number(status));
        }
      },
    );

    and('the last call rejects with CircuitOpenError', () => {
      expectCircuitOpen(outcomes[outcomes.length - 1]);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('An open server status circuit leaves the dogma attribute index reachable', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given(
      /^a client whose circuit breaker opens after (\d+) failures?, with no retries$/,
      (threshold: string) => {
        client = circuitClient(Number(threshold));
      },
    );

    and('the circuit for the server status endpoint has opened', async () => {
      queueError(503, 'unavailable', { match: STATUS_PATH });
      expectEsiError(await settle(client.status.getStatus()), 503);
    });

    and('ESI answers the dogma attribute index request with a payload', () => {
      queueResponse({
        body: DOGMA_ATTRIBUTE_IDS,
        match: DOGMA_ATTRIBUTES_PATH,
      });
    });

    when('the client requests the dogma attribute index', async () => {
      outcome = await settle(client.dogma.getAttributes());
    });

    then('the client resolves with the dogma attribute identifiers', () => {
      expectResolvedWith(outcome, DOGMA_ATTRIBUTE_IDS);
    });

    and('the circuit for the server status endpoint is open', () => {
      expect(circuitState(client, STATUS_PATH)).toBe('open');
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('Repeated 404s leave the circuit closed', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    const outcomes: Outcome[] = [];

    given(
      /^a client whose circuit breaker opens after (\d+) failures?, with no retries$/,
      (threshold: string) => {
        client = circuitClient(Number(threshold));
      },
    );

    and(
      /^ESI answers the server status request with HTTP (\d+) (\d+) times$/,
      (status: string, times: string) => {
        queueError(Number(status), 'not found', {
          match: STATUS_PATH,
          times: Number(times),
        });
      },
    );

    when(
      /^the client requests the server status (\d+) times$/,
      async (times: string) => {
        for (let i = 0; i < Number(times); i++) {
          outcomes.push(await settle(client.status.getStatus()));
        }
      },
    );

    then(
      /^the first (\d+) calls reject with an EsiError carrying status (\d+)$/,
      (count: string, status: string) => {
        expect(outcomes).toHaveLength(Number(count));
        for (const outcome of outcomes) {
          expectEsiError(outcome, Number(status));
        }
      },
    );

    and('the circuit for the server status endpoint is closed', () => {
      expect(circuitState(client, STATUS_PATH)).toBe('closed');
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('A failed probe reopens the circuit', ({ given, and, when, then }) => {
    let client: EsiClient;
    let resetMs: number;
    const outcomes: Outcome[] = [];

    given(
      /^a client whose circuit breaker opens after (\d+) failures? and resets after (\d+) milliseconds, with no retries or deduplication$/,
      (threshold: string, reset: string) => {
        resetMs = Number(reset);
        client = circuitClient(Number(threshold), {
          circuitBreakerConfig: {
            failureThreshold: Number(threshold),
            resetTimeoutMs: resetMs,
          },
          enableRequestDeduplication: false,
        });
      },
    );

    and('the circuit for the server status endpoint has opened', async () => {
      queueError(503, 'unavailable', { match: STATUS_PATH });
      expectEsiError(await settle(client.status.getStatus()), 503);
    });

    and('the reset timeout has elapsed', async () => {
      await sleep(resetMs + 20);
    });

    and('ESI answers the server status probe with HTTP 503', () => {
      queueError(503, 'still unavailable', { match: STATUS_PATH });
    });

    when(
      /^the client requests the server status (\d+) times$/,
      async (times: string) => {
        for (let i = 0; i < Number(times); i++) {
          outcomes.push(await settle(client.status.getStatus()));
        }
      },
    );

    then('the first call rejects with an EsiError carrying status 503', () => {
      expectEsiError(outcomes[0], 503);
    });

    and('the last call rejects with CircuitOpenError', () => {
      expectCircuitOpen(outcomes[outcomes.length - 1]);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      // The opening failure plus the failed probe; the refused call sent none.
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('The second of four attempts opens the circuit and ends the call', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcome: Outcome;

    given(
      /^a client whose circuit breaker opens after (\d+) failures?, with retries enabled$/,
      (threshold: string) => {
        client = circuitClient(Number(threshold), { retryConfig: SEAM_RETRY });
      },
    );

    and(
      /^ESI answers the server status request with HTTP (\d+) (\d+) times$/,
      (status: string, times: string) => {
        queueError(Number(status), 'unavailable', {
          match: STATUS_PATH,
          times: Number(times),
        });
      },
    );

    when('the client requests the server status', async () => {
      outcome = await settle(client.status.getStatus());
    });

    then('the client rejects with CircuitOpenError', () => {
      expectCircuitOpen(outcome);
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  // ── Deduplication of in-flight requests ────────────────────────────

  test('Two concurrent server status requests share one HTTP request', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcomes: Outcome[];

    given('a client with request deduplication and no ETag cache', () => {
      client = createSeamClient({ enableETagCache: false });
    });

    and(
      /^ESI answers the server status request after (\d+) milliseconds with a payload$/,
      (delay: string) => {
        queueResponse({
          body: FIRST_PAYLOAD,
          delayMs: Number(delay),
          match: STATUS_PATH,
        });
      },
    );

    when('the client requests the server status twice at once', async () => {
      outcomes = await Promise.allSettled([
        client.status.getStatus(),
        client.status.getStatus(),
      ]);
    });

    then('both calls resolve with the payload', () => {
      expect(outcomes).toHaveLength(2);
      for (const outcome of outcomes) {
        expectResolvedWith(outcome, FIRST_PAYLOAD);
      }
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('Two concurrent callers of a failing request both reject', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcomes: Outcome[];

    given('a client with request deduplication and no ETag cache', () => {
      client = createSeamClient({ enableETagCache: false });
    });

    and(
      /^ESI answers the server status request after (\d+) milliseconds with HTTP (\d+)$/,
      (delay: string, status: string) => {
        queueResponse({
          status: Number(status),
          body: { error: 'not found' },
          delayMs: Number(delay),
          match: STATUS_PATH,
        });
      },
    );

    when('the client requests the server status twice at once', async () => {
      outcomes = await Promise.allSettled([
        client.status.getStatus(),
        client.status.getStatus(),
      ]);
    });

    then(
      /^both calls reject with an EsiError carrying status (\d+)$/,
      (status: string) => {
        expect(outcomes).toHaveLength(2);
        for (const outcome of outcomes) {
          expectEsiError(outcome, Number(status));
        }
      },
    );

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('A second server status request after the first resolves issues its own request', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    const outcomes: Outcome[] = [];

    given('a client with request deduplication and no ETag cache', () => {
      client = createSeamClient({ enableETagCache: false });
    });

    and(
      /^ESI answers the server status request after (\d+) milliseconds with a payload (\d+) times$/,
      (delay: string, times: string) => {
        queueResponse({
          body: FIRST_PAYLOAD,
          delayMs: Number(delay),
          match: STATUS_PATH,
          times: Number(times),
        });
      },
    );

    when(
      /^the client requests the server status (\d+) times$/,
      async (times: string) => {
        for (let i = 0; i < Number(times); i++) {
          outcomes.push(await settle(client.status.getStatus()));
        }
      },
    );

    then(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(outcomes.every((o) => o.status === 'fulfilled')).toBe(true);
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('Two concurrent server status requests without deduplication issue two requests', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcomes: Outcome[];

    given('a client without request deduplication or an ETag cache', () => {
      client = createSeamClient({
        enableETagCache: false,
        enableRequestDeduplication: false,
      });
    });

    and(
      /^ESI answers the server status request after (\d+) milliseconds with a payload (\d+) times$/,
      (delay: string, times: string) => {
        queueResponse({
          body: FIRST_PAYLOAD,
          delayMs: Number(delay),
          match: STATUS_PATH,
          times: Number(times),
        });
      },
    );

    when('the client requests the server status twice at once', async () => {
      outcomes = await Promise.allSettled([
        client.status.getStatus(),
        client.status.getStatus(),
      ]);
    });

    then('both calls resolve with the payload', () => {
      expect(outcomes).toHaveLength(2);
      for (const outcome of outcomes) {
        expectResolvedWith(outcome, FIRST_PAYLOAD);
      }
    });

    and(/^the client sent (\d+) requests?$/, (count: string) => {
      expect(requestsSent()).toBe(Number(count));
    });
  });

  test('Two concurrent name resolution POSTs issue two requests', ({
    given,
    and,
    when,
    then,
  }) => {
    let client: EsiClient;
    let outcomes: Outcome[];

    given('a client with request deduplication and no ETag cache', () => {
      client = createSeamClient({ enableETagCache: false });
    });

    and(
      /^ESI answers the name resolution request after (\d+) milliseconds with names (\d+) times$/,
      (delay: string, times: string) => {
        queueResponse({
          body: RESOLVED_NAMES,
          delayMs: Number(delay),
          match: NAMES_PATH,
          times: Number(times),
        });
      },
    );

    when(
      'the client posts identifiers for name resolution twice at once',
      async () => {
        const ids = [RESOLVED_NAMES[0]!.id];
        outcomes = await Promise.allSettled([
          client.universe.postNamesAndCategories(ids),
          client.universe.postNamesAndCategories(ids),
        ]);
      },
    );

    then(/^the client sent (\d+) requests?$/, (count: string) => {
      for (const outcome of outcomes) {
        expectResolvedWith(outcome, RESOLVED_NAMES);
      }
      expect(requestsSent()).toBe(Number(count));
    });
  });
});
