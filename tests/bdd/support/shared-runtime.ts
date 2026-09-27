/**
 * What 0056-shared-runtime.feature builds, queues and reads: a seam runtime
 * over the generated operations, the identities its views run as, and the
 * routes they call.
 */
import { EsiTokenManager } from '../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import { createEsi, type Esi, type EsiOptions } from '../../../src/client';
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
