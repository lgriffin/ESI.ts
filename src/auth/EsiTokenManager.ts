import { EsiClient, EsiClientConfig } from '../EsiClient';
import type { FetchLike, TokenProvider } from '../core/ApiClient';
import type { ILogger } from '../core/logger/ILogger';
import { getLogger } from '../core/logger/loggerUtil';
import { runWithConcurrency } from '../core/util/concurrency';
import {
  EveSsoClient,
  SsoTokenResponse,
  AuthorizationUrlOptions,
  ExchangeCodeOptions,
} from './EveSsoClient';
import { CharacterNotFoundError, SsoError, TokenRevokedError } from './errors';
import { decodeAccessToken, DecodedAccessToken } from './jwt';
import { MemoryTokenStorage } from './storage/MemoryTokenStorage';
import type { ITokenStorage, StoredToken } from './types';

export interface EsiTokenManagerConfig {
  /** The application's SSO client id. */
  clientId: string;
  /** The application's SSO client secret. Omit for a public (PKCE) client. */
  clientSecret?: string;
  /** Redirect URI registered for the application. */
  callbackUrl?: string;
  /** Where tokens are persisted. Defaults to {@link MemoryTokenStorage}. */
  storage?: ITokenStorage;
  /** Pre-built SSO client. When given, `clientId`, `clientSecret`, `callbackUrl` and `fetch` are ignored for SSO calls. */
  ssoClient?: EveSsoClient;
  /** Custom fetch for SSO calls. Defaults to `globalThis.fetch`. */
  fetch?: FetchLike;
  /**
   * How long before expiry a token counts as stale, in milliseconds.
   * Defaults to 60 000 (one minute).
   */
  refreshSkewMs?: number;
  /**
   * When true (the default), {@link EsiTokenManager.getToken} refreshes a
   * stale token before returning it. When false it returns the stored token
   * as-is and refresh only happens through {@link EsiTokenManager.refresh},
   * {@link EsiTokenManager.refreshAll}, or the 401 path of a created client.
   */
  autoRefresh?: boolean;
  /** Called after a token is refreshed and persisted. */
  onRefresh?: (token: StoredToken) => void;
  /** Called when a refresh fails for a reason other than revocation. */
  onRefreshError?: (characterId: number, error: Error) => void;
  /** Called when SSO reports a character's refresh token as invalid. */
  onRevoked?: (characterId: number) => void;
  /** Logger for refresh activity. Defaults to the library logger. */
  logger?: ILogger;
  /** Clock override for tests. */
  now?: () => number;
}

export interface AddCharacterOptions extends ExchangeCodeOptions {
  /**
   * When the character already has a stored token, revoke its refresh token
   * at SSO before replacing it. Defaults to false.
   */
  revokeReplaced?: boolean;
}

export interface RemoveCharacterOptions {
  /** Revoke the refresh token at SSO before deleting it. Defaults to false. */
  revoke?: boolean;
}

export interface RefreshAllOptions {
  /** Maximum simultaneous SSO requests. Defaults to 5. */
  concurrency?: number;
  /**
   * Only refresh tokens that expire within this many milliseconds (after
   * applying the refresh skew). Omit to refresh every token.
   */
  expiringWithinMs?: number;
  /** Abort the run; remaining tokens are reported as skipped. */
  signal?: AbortSignal;
  /**
   * Progress callback, invoked after each token settles. A callback that
   * throws does not stop the run; the exception is discarded.
   */
  onProgress?: (completed: number, total: number) => void;
}

export type RefreshStatus = 'refreshed' | 'skipped' | 'failed' | 'revoked';

export interface RefreshResult {
  characterId: number;
  status: RefreshStatus;
  /** New expiry in epoch milliseconds, when refreshed. */
  expiresAt?: number;
  /** The error, when failed or revoked. */
  error?: Error;
  /** True when the failure was an SSO 429 or 5xx and can be retried later. */
  retryable?: boolean;
  /** Why the token was skipped. */
  reason?: 'not-stale' | 'aborted';
}

/** Lightweight view of a stored character, without the secrets. */
export interface CharacterSummary {
  characterId: number;
  characterName: string;
  scopes: string[];
  expiresAt: number;
  revoked: boolean;
}

/** EsiClient options a manager-created client accepts; token fields are supplied by the manager. */
export type ManagedClientConfig = Omit<
  EsiClientConfig,
  'accessToken' | 'onTokenRefresh'
>;

/**
 * Keeps one valid SSO token per character on top of a pluggable
 * {@link ITokenStorage}, refreshing ahead of expiry, coalescing concurrent
 * refreshes, persisting rotated refresh tokens, and recording revocations so
 * SSO is not hammered with a dead refresh token.
 */
export class EsiTokenManager {
  private readonly storage: ITokenStorage;
  private readonly sso: EveSsoClient;
  private readonly refreshSkewMs: number;
  private readonly autoRefresh: boolean;
  private readonly logger: ILogger;
  private readonly now: () => number;
  private readonly hooks: Pick<
    EsiTokenManagerConfig,
    'onRefresh' | 'onRefreshError' | 'onRevoked'
  >;
  private readonly inFlight = new Map<number, Promise<StoredToken>>();
  /**
   * Per-character write generation. Bumped whenever a record is replaced or
   * removed so a refresh that was already waiting on SSO can tell its result
   * is stale and must not be persisted over the newer state.
   */
  private readonly generations = new Map<number, number>();

  constructor(config: EsiTokenManagerConfig) {
    this.storage = config.storage ?? new MemoryTokenStorage();
    this.sso =
      config.ssoClient ??
      new EveSsoClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        callbackUrl: config.callbackUrl,
        fetch: config.fetch,
      });
    this.refreshSkewMs = config.refreshSkewMs ?? 60_000;
    this.autoRefresh = config.autoRefresh ?? true;
    this.logger = config.logger ?? getLogger();
    this.now = config.now ?? (() => Date.now());
    this.hooks = {
      onRefresh: config.onRefresh,
      onRefreshError: config.onRefreshError,
      onRevoked: config.onRevoked,
    };
  }

  /** The SSO client used for all token traffic. */
  getSsoClient(): EveSsoClient {
    return this.sso;
  }

  /** The storage adapter backing this manager. */
  getStorage(): ITokenStorage {
    return this.storage;
  }

  /** Build the SSO login URL. See {@link EveSsoClient.getAuthorizationUrl}. */
  getAuthorizationUrl(options: AuthorizationUrlOptions): string {
    return this.sso.getAuthorizationUrl(options);
  }

  /**
   * Exchange an authorization code and store the resulting token under the
   * character it belongs to. An existing token for that character is
   * replaced; storage never holds two entries for one character.
   */
  async addCharacter(
    code: string,
    options: AddCharacterOptions = {},
  ): Promise<StoredToken> {
    const response = await this.sso.exchangeCode(code, {
      codeVerifier: options.codeVerifier,
      redirectUri: options.redirectUri,
    });
    return this.storeResponse(response, {
      revokeReplaced: options.revokeReplaced,
    });
  }

  /**
   * Import tokens obtained elsewhere (a previous library version, another
   * tool, a migration). The character identity is decoded from the access
   * token; `expiresIn` is in seconds and defaults to the JWT `exp` claim.
   */
  async importToken(token: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  }): Promise<StoredToken> {
    return this.storeResponse({
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresIn: token.expiresIn ?? 0,
      tokenType: 'Bearer',
    });
  }

  /** Delete a character's token, optionally revoking it at SSO first. */
  async removeCharacter(
    characterId: number,
    options: RemoveCharacterOptions = {},
  ): Promise<void> {
    const stored = await this.storage.get(characterId);
    if (!stored) return;
    if (options.revoke && !stored.revokedAt) {
      await this.sso.revoke(stored.refreshToken);
    }
    await this.storage.delete(characterId);
    this.bumpGeneration(characterId);
    this.inFlight.delete(characterId);
  }

  /** The stored record for a character, or null. */
  async getStoredToken(characterId: number): Promise<StoredToken | null> {
    return this.storage.get(characterId);
  }

  /** Every stored token. */
  async listTokens(): Promise<StoredToken[]> {
    return this.storage.list();
  }

  /** Every stored character without its secrets. */
  async listCharacters(): Promise<CharacterSummary[]> {
    const tokens = await this.storage.list();
    return tokens.map((t) => ({
      characterId: t.characterId,
      characterName: t.characterName,
      scopes: [...t.scopes],
      expiresAt: t.expiresAt,
      revoked: t.revokedAt !== undefined,
    }));
  }

  /** True when the stored token grants every listed scope. */
  async hasScopes(
    characterId: number,
    scopes: readonly string[],
  ): Promise<boolean> {
    const stored = await this.storage.get(characterId);
    if (!stored) return false;
    const granted = new Set(stored.scopes);
    return scopes.every((s) => granted.has(s));
  }

  /**
   * A usable access token for the character. With `autoRefresh` on, a token
   * inside the refresh skew is refreshed first.
   *
   * @throws CharacterNotFoundError when no token is stored
   * @throws TokenRevokedError when the character's refresh token is revoked
   */
  async getToken(characterId: number): Promise<string> {
    const stored = await this.requireStored(characterId);
    if (stored.revokedAt !== undefined) {
      throw new TokenRevokedError(
        `Refresh token for character ${characterId} was revoked; add the character again`,
        characterId,
      );
    }
    if (this.autoRefresh && this.isStale(stored)) {
      const refreshed = await this.refresh(characterId);
      return refreshed.accessToken;
    }
    return stored.accessToken;
  }

  /**
   * Refresh a character's token through SSO regardless of expiry. Concurrent
   * calls for the same character share one SSO request.
   */
  refresh(characterId: number): Promise<StoredToken> {
    const pending = this.inFlight.get(characterId);
    if (pending) return pending;

    const run: Promise<StoredToken> = this.doRefresh(characterId).finally(
      () => {
        // Only clear our own slot: a newer refresh may have replaced it.
        if (this.inFlight.get(characterId) === run) {
          this.inFlight.delete(characterId);
        }
      },
    );
    this.inFlight.set(characterId, run);
    return run;
  }

  /**
   * Refresh stored tokens with bounded concurrency. Per-character failures
   * never reject: each character gets its own {@link RefreshResult}. The one
   * rejection is a failing `storage.list()`, because with no records there
   * is no character to attribute the fault to and a silent empty run would
   * hide a broken store from a scheduler.
   */
  async refreshAll(options: RefreshAllOptions = {}): Promise<RefreshResult[]> {
    const tokens = await this.storage.list();
    const settled = await runWithConcurrency(
      tokens,
      (token) => this.refreshOne(token, options),
      { concurrency: options.concurrency, onProgress: options.onProgress },
    );
    return settled.map((entry, index) =>
      entry.status === 'fulfilled'
        ? entry.value
        : {
            characterId: tokens[index]!.characterId,
            status: 'failed',
            error: toError(entry.reason),
            retryable: false,
          },
    );
  }

  /**
   * A {@link TokenProvider} bound to a character, for `onTokenRefresh`. Every
   * invocation refreshes through SSO (coalesced), because the client only
   * calls it after ESI has rejected the current token.
   */
  tokenProviderFor(characterId: number): TokenProvider {
    return async () => {
      const refreshed = await this.refresh(characterId);
      return refreshed.accessToken;
    };
  }

  /**
   * An {@link EsiClient} whose access token and refresh provider are bound to
   * the character. The token is validated (and refreshed if stale) first.
   */
  async createClient(
    characterId: number,
    config: ManagedClientConfig = {},
  ): Promise<EsiClient> {
    const accessToken = await this.getToken(characterId);
    return new EsiClient({
      ...config,
      accessToken,
      onTokenRefresh: this.tokenProviderFor(characterId),
    });
  }

  // ── internals ───────────────────────────────────────────────────────

  private isStale(token: StoredToken, withinMs: number = 0): boolean {
    return token.expiresAt - this.refreshSkewMs <= this.now() + withinMs;
  }

  private async requireStored(characterId: number): Promise<StoredToken> {
    const stored = await this.storage.get(characterId);
    if (!stored) throw new CharacterNotFoundError(characterId);
    return stored;
  }

  private generationOf(characterId: number): number {
    return this.generations.get(characterId) ?? 0;
  }

  private bumpGeneration(characterId: number): void {
    this.generations.set(characterId, this.generationOf(characterId) + 1);
  }

  /**
   * After an SSO round trip, decide whether the refresh still owns the
   * character's record. Returns null when it does. When the record was
   * replaced meanwhile, returns the current record so the caller hands out
   * the newer credentials; when it was removed, throws CharacterNotFoundError.
   */
  private async supersededBy(
    characterId: number,
    generation: number,
  ): Promise<StoredToken | null> {
    if (this.generationOf(characterId) === generation) return null;
    const current = await this.storage.get(characterId);
    if (!current) throw new CharacterNotFoundError(characterId);
    this.logger.debug(
      `Discarding stale refresh for character ${characterId}; token was replaced while the refresh was in flight`,
    );
    return current;
  }

  private async doRefresh(characterId: number): Promise<StoredToken> {
    const stored = await this.requireStored(characterId);
    if (stored.revokedAt !== undefined) {
      throw new TokenRevokedError(
        `Refresh token for character ${characterId} was revoked; add the character again`,
        characterId,
      );
    }
    const generation = this.generationOf(characterId);
    let response: SsoTokenResponse;
    try {
      response = await this.sso.refresh(stored.refreshToken);
    } catch (err: unknown) {
      if (err instanceof TokenRevokedError) {
        // A revocation of a token that has since been replaced says nothing
        // about the replacement; a removed character has nothing to mark.
        const superseded = await this.supersededBy(characterId, generation);
        if (superseded) return superseded;
        const revoked = {
          ...stored,
          revokedAt: this.now(),
          updatedAt: this.now(),
        };
        await this.storage.set(characterId, revoked);
        this.logger.warn(
          `SSO revoked refresh token for character ${characterId}`,
        );
        this.hooks.onRevoked?.(characterId);
        throw new TokenRevokedError(err.message, characterId);
      }
      const error = toError(err);
      this.logger.error(
        `Token refresh failed for character ${characterId}: ${error.message}`,
      );
      this.hooks.onRefreshError?.(characterId, error);
      throw error;
    }
    const superseded = await this.supersededBy(characterId, generation);
    if (superseded) return superseded;
    const updated = this.buildStoredToken(response, stored);
    await this.storage.set(characterId, updated);
    this.logger.debug(`Refreshed token for character ${characterId}`);
    this.hooks.onRefresh?.(updated);
    return updated;
  }

  private async refreshOne(
    token: StoredToken,
    options: RefreshAllOptions,
  ): Promise<RefreshResult> {
    const { characterId } = token;
    if (options.signal?.aborted) {
      return { characterId, status: 'skipped', reason: 'aborted' };
    }
    if (token.revokedAt !== undefined) {
      return {
        characterId,
        status: 'revoked',
        error: new TokenRevokedError(
          `Refresh token for character ${characterId} was revoked`,
          characterId,
        ),
        retryable: false,
      };
    }
    if (
      options.expiringWithinMs !== undefined &&
      !this.isStale(token, options.expiringWithinMs)
    ) {
      return { characterId, status: 'skipped', reason: 'not-stale' };
    }
    try {
      const refreshed = await this.refresh(characterId);
      return {
        characterId,
        status: 'refreshed',
        expiresAt: refreshed.expiresAt,
      };
    } catch (err: unknown) {
      const error = toError(err);
      if (error instanceof TokenRevokedError) {
        return { characterId, status: 'revoked', error, retryable: false };
      }
      return {
        characterId,
        status: 'failed',
        error,
        retryable: error instanceof SsoError && error.isRetryable(),
      };
    }
  }

  private async storeResponse(
    response: SsoTokenResponse,
    options: { revokeReplaced?: boolean } = {},
  ): Promise<StoredToken> {
    const token = this.buildStoredToken(response);
    const existing = await this.storage.get(token.characterId);
    if (existing) {
      const missing = existing.scopes.filter((s) => !token.scopes.includes(s));
      if (missing.length > 0) {
        this.logger.warn(
          `Replacing token for character ${token.characterId} drops scopes: ${missing.join(' ')}`,
        );
      }
      if (options.revokeReplaced && !existing.revokedAt) {
        await this.sso.revoke(existing.refreshToken);
      }
    }
    await this.storage.set(token.characterId, token);
    this.bumpGeneration(token.characterId);
    this.inFlight.delete(token.characterId);
    return token;
  }

  /**
   * Build the record to persist. When adding a character the access token
   * must decode, because it is the only source of the character id. On a
   * refresh the identity is already known, so a token that does not decode
   * (a proxy, a future SSO format) keeps the previous record's identity.
   */
  private buildStoredToken(
    response: SsoTokenResponse,
    previous?: StoredToken,
  ): StoredToken {
    let decoded: Partial<DecodedAccessToken> = {};
    try {
      decoded = decodeAccessToken(response.accessToken);
    } catch (err: unknown) {
      if (!previous) throw err;
      this.logger.debug(
        `Refreshed access token for character ${previous.characterId} did not decode as a JWT; keeping stored identity`,
      );
    }
    const now = this.now();
    const expiresAt =
      response.expiresIn > 0
        ? now + response.expiresIn * 1000
        : (decoded.expiresAt ?? now);
    const scopes =
      decoded.scopes && decoded.scopes.length > 0
        ? decoded.scopes
        : (previous?.scopes ?? []);
    const token: StoredToken = {
      characterId: decoded.characterId ?? previous!.characterId,
      characterName: decoded.characterName || previous?.characterName || '',
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt,
      scopes,
      updatedAt: now,
    };
    const ownerHash = decoded.ownerHash ?? previous?.ownerHash;
    if (ownerHash !== undefined) token.ownerHash = ownerHash;
    return token;
  }
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
