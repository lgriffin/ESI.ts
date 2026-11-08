/**
 * What 0068-token-manager-records.feature configures and reads: a token
 * manager over in-memory storage with a fixed clock, a recording logger and
 * recording hooks, and EVE SSO's token and revoke endpoints answered at the
 * transport seam.
 */
import {
  EsiTokenManager,
  type CharacterSummary,
  type RefreshResult,
} from '../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import type { StoredToken } from '../../../src/auth/types';
import {
  makeStoredToken,
  ssoTokenBody,
  type SsoTokenBodyOptions,
  type StoredTokenOptions,
} from '../step-definitions/shared/sso-helpers';
import { recordingLogger, type RecordingLogger } from './logging';
import { queueResponse, sentRequests } from './transport';
import type { World } from './world';

export const MANAGER_CLIENT_ID = 'test-client-id';

/** What the manager's hooks were called with, in order. */
export interface HookCalls {
  refreshed: StoredToken[];
  refreshErrors: Array<{ characterId: number; error: Error }>;
  revoked: number[];
}

export interface ManagerState {
  manager: EsiTokenManager;
  storage: MemoryTokenStorage;
  logger: RecordingLogger;
  hooks: HookCalls;
  /** Epoch milliseconds the manager's clock reads. */
  clock: number;
}

/**
 * Builds the scenario's token manager. `clientSecret: false` makes it a
 * public client (PKCE), which sends no secret.
 */
export function managerState(
  world: World,
  options: { clientSecret?: false } = {},
): ManagerState {
  const storage = new MemoryTokenStorage();
  const logger = recordingLogger();
  const hooks: HookCalls = { refreshed: [], refreshErrors: [], revoked: [] };
  const state: ManagerState = {
    storage,
    logger,
    hooks,
    clock: Date.now(),
    manager: undefined as unknown as EsiTokenManager,
  };
  state.manager = new EsiTokenManager({
    clientId: MANAGER_CLIENT_ID,
    ...(options.clientSecret === false
      ? {}
      : { clientSecret: 'test-client-secret' }),
    storage,
    logger,
    now: () => state.clock,
    onRefresh: (token) => hooks.refreshed.push(token),
    onRefreshError: (characterId, error) =>
      hooks.refreshErrors.push({ characterId, error }),
    onRevoked: (characterId) => hooks.revoked.push(characterId),
  });
  world.values.manager = state;
  world.values.logger = logger;
  return state;
}

/** The scenario's token manager state, built by a Given step. */
export function manager(world: World): ManagerState {
  return world.values.manager as ManagerState;
}

/** Stores a token for `characterId` the way an earlier login would have. */
export async function storeCharacter(
  world: World,
  characterId: number,
  options: StoredTokenOptions = {},
): Promise<StoredToken> {
  const token = makeStoredToken({
    characterId,
    refreshToken: `refresh-${characterId}`,
    ...options,
  });
  await manager(world).storage.set(characterId, token);
  return token;
}

/** Answers the next request to SSO's token endpoint with a new token. */
export function queueTokenAnswer(options: SsoTokenBodyOptions = {}): void {
  queueResponse({ match: '/v2/oauth/token', body: ssoTokenBody(options) });
}

/** Answers the next request to SSO's token endpoint with an error. */
export function queueTokenError(status: number, errorCode: string): void {
  queueResponse({
    match: '/v2/oauth/token',
    status,
    body: { error: errorCode, error_description: `SSO returned ${errorCode}` },
  });
}

/** Answers the next request to SSO's revoke endpoint. */
export function queueRevokeAnswer(): void {
  queueResponse({ match: '/v2/oauth/revoke', status: 200, body: '' });
}

/** The form fields of every request sent to an SSO endpoint path. */
export function ssoForms(path: string): URLSearchParams[] {
  return sentRequests()
    .filter((r) => r.url.pathname === path)
    .map((r) => new URLSearchParams(r.body ?? ''));
}

/** Runs `action`, recording what it resolved or threw on the world. */
export async function attempt(
  world: World,
  action: () => Promise<unknown>,
): Promise<void> {
  try {
    world.result = await action();
  } catch (err: unknown) {
    world.error = err;
  }
}

/** `jwt` with one claim removed from its payload; the signature is left as it was. */
export function jwtWithout(jwt: string, claim: string): string {
  const [header, payload, signature] = jwt.split('.');
  const claims = JSON.parse(
    Buffer.from(payload!, 'base64url').toString('utf8'),
  ) as Record<string, unknown>;
  delete claims[claim];
  const edited = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return [header, edited, signature].join('.');
}

/** The stored record for `characterId`, failing the step when there is none. */
export async function storedToken(
  world: World,
  characterId: number,
): Promise<StoredToken> {
  expect(world.error).toBeUndefined();
  const stored = await manager(world).storage.get(characterId);
  expect(stored).not.toBeNull();
  return stored!;
}

/** The refreshAll result for `characterId`. */
export function bulkResult(world: World, characterId: number): RefreshResult {
  expect(world.error).toBeUndefined();
  const results = world.result as RefreshResult[];
  const result = results.find((r) => r.characterId === characterId);
  expect(result).toBeDefined();
  return result!;
}

/** The listCharacters entry for `characterId`. */
export function listedCharacter(
  world: World,
  characterId: number,
): CharacterSummary {
  expect(world.error).toBeUndefined();
  const entry = (world.result as CharacterSummary[]).find(
    (c) => c.characterId === characterId,
  );
  expect(entry).toBeDefined();
  return entry!;
}
