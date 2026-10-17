/**
 * What 0056-shared-runtime.feature builds, queues and reads: a seam runtime
 * over the generated operations, the identities its views run as, and the
 * routes they call.
 */
import { EsiTokenManager } from '../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import {
  type CachedResponse,
  type CacheStore,
  type Clock,
  createEsi,
  type Esi,
  type EsiOptions,
  type Identity,
  type OperationMeta,
} from '../../../src/client';
import { RateLimiter } from '../../../src/core/rateLimiter/RateLimiter';
import { RequestDeduplicator } from '../../../src/core/RequestDeduplicator';
import { getStatusMeta } from '../../../src/generated/operations.generated';
import {
  makeJwt,
  makeStoredToken,
  SSO_TOKEN_URL,
  ssoTokenBody,
} from '../step-definitions/shared/sso-helpers';
import {
  queueResponse,
  type RecordedRequest,
  SEAM_RETRY,
  sentRequests,
} from './transport';
import type { World } from './world';

export const APPLICATION = 'fleet-tool/2.1 (ops@example.com)';
export const RAW_TOKEN = 'raw-access-token';
export const CHARACTER_ID = 2_114_794_365;
export const OTHER_CHARACTER_ID = 2_114_794_366;
export const CORPORATION_ID = 98_000_001;
export const WALLET_BALANCE = 1_234_567.89;

export const WALLET_PATH = /\/characters\/\d+\/wallet(\?|$)/;
export const CORPORATION_WALLETS_PATH = /\/corporations\/\d+\/wallets(\?|$)/;
export const ALLIANCES_PATH = /\/alliances\/?(\?|$)/;

export const corporationWallets = () => [
  { division: 1, balance: 10_000_000 },
  { division: 2, balance: 0 },
];

/** A runtime wired for the seam: no inter-request delay, millisecond retries. */
export function createSeamRuntime(options: Partial<EsiOptions> = {}): Esi {
  return createEsi({
    userAgent: APPLICATION,
    baseUrl: 'https://esi.evetech.net',
    timeout: 5000,
    retryConfig: SEAM_RETRY,
    logLevel: 'error',
    ...options,
    rateLimiterConfig: { minDelayMs: 0, ...options.rateLimiterConfig },
  });
}

/** The runtime a Given step built, or a failure naming the missing step. */
export function runtimeOf(world: World): Esi {
  if (!world.esi)
    throw new Error(
      'No runtime: add "Given a runtime for the application" first',
    );
  return world.esi;
}

/** A token manager over in-memory storage that already holds the character. */
export async function managedCharacter(
  characterId: number,
  options: { expiresInSeconds?: number } = {},
): Promise<{ manager: EsiTokenManager; accessToken: string }> {
  const storage = new MemoryTokenStorage();
  const stored = makeStoredToken({
    characterId,
    expiresInSeconds: options.expiresInSeconds,
  });
  await storage.set(characterId, stored);
  const manager = new EsiTokenManager({ clientId: 'test-client-id', storage });
  return { manager, accessToken: stored.accessToken };
}

/** Queue, at the seam, the SSO answer to the character's next refresh. */
export function queueSsoRefresh(characterId: number): string {
  const accessToken = makeJwt({ characterId });
  queueResponse({
    match: SSO_TOKEN_URL,
    body: ssoTokenBody({ characterId, accessToken }),
    headers: { 'content-type': 'application/json' },
  });
  return accessToken;
}

export function queueWalletBalance(times = 1): void {
  queueResponse({ match: WALLET_PATH, body: WALLET_BALANCE, times });
}

/** The requests that went to ESI, leaving out the SSO refresh calls. */
export function esiRequests(): readonly RecordedRequest[] {
  return sentRequests().filter((r) => r.url.host === 'esi.evetech.net');
}

// ── Response metadata (G8)

/** The headers a metadata scenario's response carries, and what they read as. */
export const RESPONSE_HEADERS = {
  etag: '"meta-v1"',
  expires: 'Sat, 17 Oct 2026 12:00:30 GMT',
  'x-pages': '1',
  'x-esi-error-limit-remain': '99',
  'x-esi-error-limit-reset': '42',
};

export const EXPECTED_META = {
  etag: '"meta-v1"',
  expires: 'Sat, 17 Oct 2026 12:00:30 GMT',
  pages: 1,
  errorLimitRemain: 99,
  errorLimitReset: 42,
  fromCache: false,
  stale: false,
};

/** The identity the "a view for a character" steps opened, for a mode view of the same character. */
export function identityOf(world: World): Identity {
  const identity = world.values.identity as Identity | undefined;
  if (!identity)
    throw new Error(
      'No identity: add "Given a view for a character holding an access token" first',
    );
  return identity;
}

// ── Supplied middleware (G11)

/** A `CacheStore` over a Map that records what it was asked, as a shared store would be. */
export class MapCacheStore implements CacheStore {
  readonly entries = new Map<string, CachedResponse>();
  shutdowns = 0;

  get(key: string): CachedResponse | null {
    return this.entries.get(key) ?? null;
  }

  set(
    key: string,
    etag: string,
    data: unknown,
    headers: Record<string, string>,
    ttlMs?: number,
  ): void {
    this.entries.set(key, {
      etag,
      data,
      headers,
      timestamp: Date.now(),
      ...(ttlMs === undefined ? {} : { ttl: ttlMs }),
    });
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  shutdown(): void {
    this.shutdowns += 1;
  }
}

/** The real rate limiter, counting the clearances it gives. */
export class CountingRateLimiter extends RateLimiter {
  cleared = 0;

  constructor() {
    super({ minDelayMs: 0 });
  }

  override async checkRateLimit(
    templatePath?: string,
    method?: string,
    requestHeaders?: Record<string, string>,
  ): Promise<void> {
    this.cleared += 1;
    return super.checkRateLimit(templatePath, method, requestHeaders);
  }
}

/** The real deduplicator, counting the requests it is asked to coalesce. */
export class CountingDeduplicator extends RequestDeduplicator {
  asked = 0;

  override dedupe<T>(key: string, execute: () => Promise<T>): Promise<T> {
    this.asked += 1;
    return super.dedupe(key, execute);
  }
}

/** A clock a scenario moves by hand; its waits resolve at once and are recorded. */
export class ManualClock implements Clock {
  private offsetMs = 0;
  readonly waits: number[] = [];

  constructor(private readonly startMs: number = Date.now()) {}

  now(): number {
    return this.startMs + this.offsetMs;
  }

  sleep(ms: number): Promise<void> {
    this.waits.push(ms);
    return Promise.resolve();
  }

  advance(ms: number): void {
    this.offsetMs += ms;
  }
}

/** The middleware a Given step supplied, for a Then step to read. */
export function suppliedOf<T>(world: World, name: string): T {
  const supplied = world.values[name] as T | undefined;
  if (supplied === undefined)
    throw new Error(`No supplied ${name}: add the Given step that supplies it`);
  return supplied;
}

// ── What the custom endpoint definitions carry too

export const PUBLIC_CONTRACT_ID = 214_400_001;
export const PUBLIC_CONTRACT_BIDS_PATH = /\/contracts\/public\/bids\/\d+(\?|$)/;
export const PUBLIC_CONTRACT_ITEMS_PATH =
  /\/contracts\/public\/items\/\d+(\?|$)/;

/** What the deprecation scenario adds to the server status metadata. */
export const STATUS_DEPRECATION = {
  message: 'Read the route status instead.',
  replacedBy: 'GetMetaStatus',
  sunsetDate: '2027-01-01',
} as const;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Marks the generated server status metadata deprecated, as the generator
 * would for an operation the spec deprecates, and returns the undo. The
 * metadata object is the one the scope tree passes to the transport, so the
 * real pipeline sees the change.
 */
export function markStatusDeprecated(): () => void {
  const meta = getStatusMeta as Mutable<OperationMeta>;
  const before = { ...meta };
  meta.deprecated = true;
  meta.deprecation = STATUS_DEPRECATION;
  return () => {
    delete meta.deprecation;
    Object.assign(meta, before);
  };
}

/** Collects every item an async iterable yields. */
export async function collect<T>(items: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of items) out.push(item);
  return out;
}
