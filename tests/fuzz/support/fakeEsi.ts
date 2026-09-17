/**
 * A stateful fake ESI for model-based properties, installed on the same
 * transport seam as tests/bdd/support/transport.ts: the global
 * `jest-fetch-mock`. Nothing between the client method and `fetch` is stubbed.
 *
 * The BDD seam serves a FIFO queue, which cannot express "answer 304 when the
 * request carries the current ETag" or "page N fails its first k attempts".
 * Properties generate those server behaviours, so they supply a handler that
 * sees each request and decides the reply. The handler is the model of ESI;
 * the client under test is real.
 *
 * Requires `fetchMock.enableMocks()` at the top of the test file, as the fuzz
 * Jest config has no setup file.
 */
import fetchMock from 'jest-fetch-mock';

import type { ApiClient } from '../../../src/core/ApiClient';
import type { configureApiClient } from '../../../src/core/configureApiClient';
import type { EsiClientConfig } from '../../../src/EsiClient';

export interface FakeRequest {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: string | undefined;
}

export interface FakeReply {
  /** Default 200. 204 and 304 replies are sent without a body. */
  status?: number;
  headers?: Record<string, string>;
  /** JSON-encoded. */
  body?: unknown;
  /** Reject the fetch as a network failure instead of replying. */
  networkError?: boolean;
}

export type FakeHandler = (
  request: FakeRequest,
) => FakeReply | Promise<FakeReply>;

export const FAKE_ESI_BASE = 'https://esi.evetech.net';

interface MockRequest {
  url: string;
  method: string;
  headers: { forEach(cb: (value: string, key: string) => void): void };
  text(): Promise<string>;
}

/** Route every fetch to `handler`. Returns the list requests are recorded into. */
export function installFakeEsi(handler: FakeHandler): FakeRequest[] {
  const requests: FakeRequest[] = [];
  fetchMock.resetMocks();
  fetchMock.mockResponse(async (raw) => {
    const request = raw as unknown as MockRequest;
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    const text = await request.text().catch(() => '');
    const recorded: FakeRequest = {
      method: request.method,
      url: new URL(request.url),
      headers,
      body: text === '' ? undefined : text,
    };
    requests.push(recorded);
    const reply = await handler(recorded);
    if (reply.networkError) throw new Error('fake ESI: connection reset');
    const status = reply.status ?? 200;
    const replyHeaders = { ...reply.headers };
    if (status === 304 || status === 204) {
      return new Response(null, { status, headers: replyHeaders }) as never;
    }
    replyHeaders['content-type'] = 'application/json';
    return {
      status,
      headers: replyHeaders,
      body: JSON.stringify(reply.body ?? null),
    };
  });
  return requests;
}

/** The two modules a pipeline is assembled from, from one module registry. */
export interface PipelineModules {
  ApiClient: typeof ApiClient;
  configureApiClient: typeof configureApiClient;
}

/**
 * An ApiClient wired the way EsiClient wires one (configureApiClient), for
 * handing to a domain client such as `new MarketClient(api)`. No inter-request
 * delay and zero retry backoff; three retries, the library default.
 *
 * Pass the modules from the same registry as the domain client, so a mutant
 * loaded with jest.isolateModules runs against its own pipeline.
 */
export function createFakeEsiApiClient(
  modules: PipelineModules,
  accessToken: string | undefined,
  config: EsiClientConfig = {},
): ApiClient {
  const api = new modules.ApiClient(
    'fuzz-property-client',
    FAKE_ESI_BASE,
    accessToken,
  );
  modules.configureApiClient(api, {
    retryConfig: { maxRetries: 3, baseDelayMs: 0, maxDelayMs: 0 },
    ...config,
    rateLimiterConfig: { minDelayMs: 0, ...config.rateLimiterConfig },
  });
  return api;
}

/** Stop the timers a configured ApiClient started. */
export function shutdownApiClient(api: ApiClient): void {
  api.getCache()?.shutdown();
  api.getCircuitBreaker()?.shutdown();
}

/** Serve `Date.now()` from a clock the property advances. Restore when done. */
export function useFakeClock(start = 1_800_000_000_000): {
  clock: { now: number };
  restore: () => void;
} {
  const clock = { now: start };
  const spy = jest.spyOn(Date, 'now').mockImplementation(() => clock.now);
  return { clock, restore: () => spy.mockRestore() };
}
