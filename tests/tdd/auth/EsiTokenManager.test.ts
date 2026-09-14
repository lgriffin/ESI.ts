import fetchMock from 'jest-fetch-mock';
import { EsiTokenManager } from '../../../src/auth/EsiTokenManager';
import { EveSsoClient } from '../../../src/auth/EveSsoClient';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import {
  CharacterNotFoundError,
  SsoError,
  TokenDecodeError,
  TokenRevokedError,
} from '../../../src/auth/errors';
import type { ILogger } from '../../../src/core/logger/ILogger';
import {
  makeJwt,
  makeStoredToken,
  readFormBody,
  readHeader,
  ssoCallCount,
  ssoErrorBody,
  ssoTokenBody,
} from '../helpers/ssoFixtures';

const silentLogger = (): ILogger & {
  warn: jest.Mock;
  error: jest.Mock;
  debug: jest.Mock;
} => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

describe('EsiTokenManager', () => {
  let storage: MemoryTokenStorage;
  let logger: ReturnType<typeof silentLogger>;

  const manager = (
    overrides: Partial<ConstructorParameters<typeof EsiTokenManager>[0]> = {},
  ) =>
    new EsiTokenManager({
      clientId: 'cid',
      clientSecret: 'secret',
      storage,
      logger,
      ...overrides,
    });

  beforeEach(() => {
    storage = new MemoryTokenStorage();
    logger = silentLogger();
  });

  describe('construction', () => {
    it('defaults to in-memory storage and a fresh SSO client', () => {
      const m = new EsiTokenManager({ clientId: 'cid' });
      expect(m.getStorage()).toBeInstanceOf(MemoryTokenStorage);
      expect(m.getSsoClient()).toBeInstanceOf(EveSsoClient);
      expect(m.getSsoClient().isConfidential()).toBe(false);
    });

    it('uses an injected SSO client', () => {
      const sso = new EveSsoClient({ clientId: 'other' });
      expect(manager({ ssoClient: sso }).getSsoClient()).toBe(sso);
    });

    it('delegates getAuthorizationUrl to the SSO client', () => {
      const url = manager({ callbackUrl: 'https://cb' }).getAuthorizationUrl({
        scopes: ['s'],
        state: 'st',
      });
      expect(url).toContain('redirect_uri=https%3A%2F%2Fcb');
      expect(url).toContain('state=st');
    });
  });

  describe('addCharacter and importToken', () => {
    it('sends the PKCE verifier through to SSO', async () => {
      fetchMock.mockResponseOnce(ssoTokenBody({ characterId: 1 }));
      await manager({ clientSecret: undefined }).addCharacter('code', {
        codeVerifier: 'v',
      });
      expect(
        readFormBody(fetchMock.mock.calls[0]![1]).get('code_verifier'),
      ).toBe('v');
    });

    it('warns when a re-authorization drops scopes', async () => {
      await storage.set(
        1,
        makeStoredToken({ characterId: 1, scopes: ['a', 'b'] }),
      );
      fetchMock.mockResponseOnce(
        ssoTokenBody({ characterId: 1, scopes: ['a'] }),
      );
      await manager().addCharacter('code');
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('drops scopes: b'),
      );
      expect((await storage.get(1))!.scopes).toEqual(['a']);
    });

    it('revokes the replaced refresh token when asked', async () => {
      await storage.set(
        1,
        makeStoredToken({ characterId: 1, refreshToken: 'old' }),
      );
      fetchMock.mockResponseOnce(
        ssoTokenBody({ characterId: 1, refreshToken: 'new' }),
      );
      fetchMock.mockResponseOnce('', { status: 200 });
      await manager().addCharacter('code', { revokeReplaced: true });
      const revokeCall = fetchMock.mock.calls.find(([u]) =>
        String(u).endsWith('/revoke'),
      );
      expect(revokeCall).toBeDefined();
      expect(readFormBody(revokeCall![1]).get('token')).toBe('old');
      expect((await storage.get(1))!.refreshToken).toBe('new');
    });

    it('does not revoke an already-revoked previous token', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1, revokedAt: 1 }));
      fetchMock.mockResponseOnce(ssoTokenBody({ characterId: 1 }));
      await manager().addCharacter('code', { revokeReplaced: true });
      expect(
        fetchMock.mock.calls.some(([u]) => String(u).endsWith('/revoke')),
      ).toBe(false);
      expect((await storage.get(1))!.revokedAt).toBeUndefined();
    });

    it('imports an existing token pair using the JWT expiry when expiresIn is omitted', async () => {
      const accessToken = makeJwt({
        characterId: 9,
        characterName: 'Nine',
        expiresInSeconds: 500,
      });
      const stored = await manager().importToken({
        accessToken,
        refreshToken: 'r9',
      });
      expect(stored.characterId).toBe(9);
      expect(stored.characterName).toBe('Nine');
      expect(stored.refreshToken).toBe('r9');
      expect(stored.expiresAt).toBeGreaterThan(Date.now() + 400_000);
      expect(ssoCallCount()).toBe(0);
    });

    it('anchors expiry to now when expiresIn is given', async () => {
      const now = 1_000_000;
      const stored = await manager({ now: () => now }).importToken({
        accessToken: makeJwt({ characterId: 9 }),
        refreshToken: 'r9',
        expiresIn: 100,
      });
      expect(stored.expiresAt).toBe(now + 100_000);
      expect(stored.updatedAt).toBe(now);
    });

    it('falls back to now when the token has neither expiresIn nor exp', async () => {
      const now = 5_000;
      const payload = Buffer.from(
        JSON.stringify({ sub: 'CHARACTER:EVE:9' }),
      ).toString('base64url');
      const stored = await manager({ now: () => now }).importToken({
        accessToken: `h.${payload}.s`,
        refreshToken: 'r9',
      });
      expect(stored.expiresAt).toBe(now);
      expect(stored.characterName).toBe('');
      expect(stored.scopes).toEqual([]);
      expect(stored.ownerHash).toBeUndefined();
    });

    it('rejects a new character whose access token cannot be decoded', async () => {
      await expect(
        manager().importToken({ accessToken: 'opaque', refreshToken: 'r' }),
      ).rejects.toBeInstanceOf(TokenDecodeError);
    });
  });

  describe('lookups', () => {
    it('getStoredToken, listTokens and listCharacters reflect storage', async () => {
      await storage.set(
        1,
        makeStoredToken({
          characterId: 1,
          characterName: 'One',
          scopes: ['a'],
        }),
      );
      await storage.set(2, makeStoredToken({ characterId: 2, revokedAt: 10 }));
      const m = manager();
      expect((await m.getStoredToken(1))!.characterName).toBe('One');
      expect(await m.getStoredToken(3)).toBeNull();
      expect(await m.listTokens()).toHaveLength(2);
      const summaries = await m.listCharacters();
      expect(summaries).toEqual([
        expect.objectContaining({
          characterId: 1,
          characterName: 'One',
          scopes: ['a'],
          revoked: false,
        }),
        expect.objectContaining({ characterId: 2, revoked: true }),
      ]);
      expect(summaries[0]).not.toHaveProperty('refreshToken');
    });

    it('hasScopes checks every requested scope', async () => {
      await storage.set(
        1,
        makeStoredToken({ characterId: 1, scopes: ['a', 'b'] }),
      );
      const m = manager();
      expect(await m.hasScopes(1, ['a'])).toBe(true);
      expect(await m.hasScopes(1, ['a', 'b'])).toBe(true);
      expect(await m.hasScopes(1, ['a', 'c'])).toBe(false);
      expect(await m.hasScopes(1, [])).toBe(true);
      expect(await m.hasScopes(99, [])).toBe(false);
    });
  });

  describe('getToken', () => {
    it('throws CharacterNotFoundError for an unknown character', async () => {
      await expect(manager().getToken(404)).rejects.toBeInstanceOf(
        CharacterNotFoundError,
      );
    });

    it('returns a stale token without refreshing when autoRefresh is off', async () => {
      const token = makeStoredToken({ characterId: 1, expiresInSeconds: 1 });
      await storage.set(1, token);
      expect(await manager({ autoRefresh: false }).getToken(1)).toBe(
        token.accessToken,
      );
      expect(ssoCallCount()).toBe(0);
    });

    it('rejects a revoked character locally', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1, revokedAt: 1 }));
      const err = await manager()
        .getToken(1)
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(TokenRevokedError);
      expect((err as TokenRevokedError).characterId).toBe(1);
      expect(ssoCallCount()).toBe(0);
    });

    it('uses the injected clock to judge staleness', async () => {
      const token = makeStoredToken({ characterId: 1, expiresInSeconds: 600 });
      await storage.set(1, token);
      fetchMock.mockResponseOnce(
        ssoTokenBody({ characterId: 1, accessToken: 'fresh' }),
      );
      // Clock says we are 590 s later, so the token is inside the 60 s skew.
      const m = manager({ now: () => Date.now() + 590_000 });
      expect(await m.getToken(1)).toBe('fresh');
    });
  });

  describe('refresh', () => {
    it('throws CharacterNotFoundError for an unknown character', async () => {
      await expect(manager().refresh(404)).rejects.toBeInstanceOf(
        CharacterNotFoundError,
      );
    });

    it('refuses to contact SSO for a revoked character', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1, revokedAt: 1 }));
      await expect(manager().refresh(1)).rejects.toBeInstanceOf(
        TokenRevokedError,
      );
      expect(ssoCallCount()).toBe(0);
    });

    it('invokes onRefresh with the persisted token', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      fetchMock.mockResponseOnce(
        ssoTokenBody({ characterId: 1, refreshToken: 'rotated' }),
      );
      const onRefresh = jest.fn();
      const result = await manager({ onRefresh }).refresh(1);
      expect(onRefresh).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'rotated' }),
      );
      expect(result.refreshToken).toBe('rotated');
    });

    it('invokes onRevoked and persists revokedAt on invalid_grant', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      fetchMock.mockResponseOnce(ssoErrorBody('invalid_grant'), {
        status: 400,
      });
      const onRevoked = jest.fn();
      const now = 777;
      await expect(
        manager({ onRevoked, now: () => now }).refresh(1),
      ).rejects.toBeInstanceOf(TokenRevokedError);
      expect(onRevoked).toHaveBeenCalledWith(1);
      expect((await storage.get(1))!.revokedAt).toBe(now);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('invokes onRefreshError and rethrows other SSO failures', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      fetchMock.mockResponseOnce(ssoErrorBody('server_error'), { status: 503 });
      const onRefreshError = jest.fn();
      await expect(
        manager({ onRefreshError }).refresh(1),
      ).rejects.toBeInstanceOf(SsoError);
      expect(onRefreshError).toHaveBeenCalledWith(1, expect.any(SsoError));
      expect((await storage.get(1))!.revokedAt).toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it('wraps non-Error rejections from the SSO client', async () => {
      const sso = new EveSsoClient({ clientId: 'cid' });
      jest.spyOn(sso, 'refresh').mockRejectedValue('string failure');
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      await expect(manager({ ssoClient: sso }).refresh(1)).rejects.toThrow(
        'string failure',
      );
    });

    it('keeps the stored identity when the refreshed token is not a JWT', async () => {
      await storage.set(
        1,
        makeStoredToken({
          characterId: 1,
          characterName: 'Keep',
          scopes: ['k'],
          ownerHash: 'oh',
        }),
      );
      fetchMock.mockResponseOnce(
        ssoTokenBody({ accessToken: 'opaque', expiresIn: 10 }),
      );
      const result = await manager().refresh(1);
      expect(result.accessToken).toBe('opaque');
      expect(result.characterName).toBe('Keep');
      expect(result.scopes).toEqual(['k']);
      expect(result.ownerHash).toBe('oh');
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('did not decode'),
      );
    });

    it('lets a new refresh start after the previous one settles', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      fetchMock.mockResponseOnce(
        ssoTokenBody({
          characterId: 1,
          accessToken: makeJwt({ characterId: 1 }),
        }),
      );
      fetchMock.mockResponseOnce(
        ssoTokenBody({
          characterId: 1,
          accessToken: makeJwt({ characterId: 1 }),
        }),
      );
      const m = manager();
      await m.refresh(1);
      await m.refresh(1);
      expect(ssoCallCount()).toBe(2);
    });
  });

  describe('removeCharacter', () => {
    it('is a no-op for an unknown character', async () => {
      await manager().removeCharacter(404);
      expect(ssoCallCount()).toBe(0);
    });

    it('deletes without contacting SSO by default', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      await manager().removeCharacter(1);
      expect(await storage.get(1)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('revokes at SSO when asked and the token is not already revoked', async () => {
      await storage.set(
        1,
        makeStoredToken({ characterId: 1, refreshToken: 'bye' }),
      );
      fetchMock.mockResponseOnce('', { status: 200 });
      await manager().removeCharacter(1, { revoke: true });
      expect(readFormBody(fetchMock.mock.calls[0]![1]).get('token')).toBe(
        'bye',
      );
      expect(await storage.get(1)).toBeNull();
    });

    it('skips the SSO call for a revoked token even when revoke is requested', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1, revokedAt: 1 }));
      await manager().removeCharacter(1, { revoke: true });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(await storage.get(1)).toBeNull();
    });
  });

  describe('refreshAll', () => {
    it('returns an empty list when nothing is stored', async () => {
      expect(await manager().refreshAll()).toEqual([]);
    });

    it('reports already-revoked tokens without contacting SSO', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1, revokedAt: 1 }));
      const [result] = await manager().refreshAll();
      expect(result).toMatchObject({
        characterId: 1,
        status: 'revoked',
        retryable: false,
      });
      expect(result!.error).toBeInstanceOf(TokenRevokedError);
      expect(ssoCallCount()).toBe(0);
    });

    it('skips every token once the signal is aborted', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      await storage.set(2, makeStoredToken({ characterId: 2 }));
      const controller = new AbortController();
      controller.abort();
      const results = await manager().refreshAll({ signal: controller.signal });
      expect(results.map((r) => r.status)).toEqual(['skipped', 'skipped']);
      expect(results[0]!.reason).toBe('aborted');
      expect(ssoCallCount()).toBe(0);
    });

    it('reports progress', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      await storage.set(2, makeStoredToken({ characterId: 2 }));
      fetchMock.mockResponse(async (req) => {
        const body = readFormBody({ body: await req.text() });
        const id = Number(body.get('refresh_token')!.replace('refresh-', ''));
        return ssoTokenBody({ characterId: id });
      });
      const onProgress = jest.fn();
      await manager().refreshAll({ onProgress, concurrency: 1 });
      expect(onProgress).toHaveBeenLastCalledWith(2, 2);
    });

    it('marks a non-SSO failure as failed and not retryable', async () => {
      const sso = new EveSsoClient({ clientId: 'cid' });
      jest.spyOn(sso, 'refresh').mockRejectedValue(new Error('network down'));
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      const [result] = await manager({ ssoClient: sso }).refreshAll();
      expect(result).toMatchObject({ status: 'failed', retryable: false });
      expect(result!.error?.message).toBe('network down');
    });

    it('marks a 5xx SSO failure as retryable', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      fetchMock.mockResponseOnce(ssoErrorBody('server_error'), { status: 502 });
      const [result] = await manager().refreshAll();
      expect(result).toMatchObject({ status: 'failed', retryable: true });
    });

    it('refreshes a token inside the window when expiringWithinMs is zero', async () => {
      await storage.set(
        1,
        makeStoredToken({ characterId: 1, expiresInSeconds: 30 }),
      );
      await storage.set(
        2,
        makeStoredToken({ characterId: 2, expiresInSeconds: 3000 }),
      );
      fetchMock.mockResponseOnce(ssoTokenBody({ characterId: 1 }));
      const results = await manager().refreshAll({ expiringWithinMs: 0 });
      expect(results.find((r) => r.characterId === 1)!.status).toBe(
        'refreshed',
      );
      expect(results.find((r) => r.characterId === 2)).toMatchObject({
        status: 'skipped',
        reason: 'not-stale',
      });
    });

    it('includes the new expiry on refreshed results', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      const now = 10_000;
      fetchMock.mockResponseOnce(
        ssoTokenBody({ characterId: 1, expiresIn: 100 }),
      );
      const [result] = await manager({ now: () => now }).refreshAll();
      expect(result).toMatchObject({
        status: 'refreshed',
        expiresAt: now + 100_000,
      });
    });

    it('converts an unexpected rejection from the worker into a failed result', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      const m = manager();
      // Force the per-token worker itself to throw, bypassing its own try/catch.
      jest
        .spyOn(
          m as unknown as { refreshOne: () => Promise<unknown> },
          'refreshOne',
        )
        .mockRejectedValue('exploded');
      const [result] = await m.refreshAll();
      expect(result).toMatchObject({
        characterId: 1,
        status: 'failed',
        retryable: false,
      });
      expect(result!.error?.message).toBe('exploded');
    });
  });

  describe('client integration', () => {
    it('tokenProviderFor refreshes through the manager', async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      fetchMock.mockResponseOnce(
        ssoTokenBody({ characterId: 1, accessToken: 'via-provider' }),
      );
      const provider = manager().tokenProviderFor(1);
      expect(await provider()).toBe('via-provider');
    });

    it('createClient rejects for an unknown character before building a client', async () => {
      await expect(manager().createClient(404)).rejects.toBeInstanceOf(
        CharacterNotFoundError,
      );
    });

    it('createClient sends the stored token and passes through client configuration', async () => {
      const token = makeStoredToken({ characterId: 1 });
      await storage.set(1, token);
      const client = await manager().createClient(1, {
        clientId: 'managed-app',
        enableETagCache: false,
        enableCircuitBreaker: false,
      });
      fetchMock.mockResponseOnce(JSON.stringify(42), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      try {
        expect(await client.wallet.getCharacterWallet(1)).toBe(42);
        const [, init] = fetchMock.mock.calls[0]!;
        expect(readHeader(init, 'Authorization')).toBe(
          `Bearer ${token.accessToken}`,
        );
        expect(client.getCacheStats()).toBeNull();
      } finally {
        client.shutdown();
      }
    });
  });
});
