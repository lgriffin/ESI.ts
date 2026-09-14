import { defineFeature, loadFeature } from 'jest-cucumber';
import fetchMock from 'jest-fetch-mock';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { EveSsoClient } from '../../../../src/auth/EveSsoClient';
import { EsiTokenManager } from '../../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../../src/auth/storage/MemoryTokenStorage';
import { FileTokenStorage } from '../../../../src/auth/storage/FileTokenStorage';
import { SsoError, TokenRevokedError } from '../../../../src/auth/errors';
import type { SsoTokenResponse } from '../../../../src/auth/EveSsoClient';
import type { RefreshResult } from '../../../../src/auth/EsiTokenManager';
import type { StoredToken } from '../../../../src/auth/types';
import type { EsiClient } from '../../../../src/EsiClient';
import {
  SSO_TOKEN_URL,
  DEFAULT_CHARACTER_ID,
  isSsoTokenRequest,
  makeStoredToken,
  makeJwt,
  queueSsoErrorResponse,
  queueSsoTokenResponse,
  readFormBody,
  readHeader,
  sleep,
  ssoCallCount,
  ssoErrorBody,
  ssoTokenBody,
} from '../shared/sso-helpers';

const feature = loadFeature(
  'tests/bdd/features/core/0054-token-management.feature',
);

const CLIENT_ID = 'test-client-id';
const CLIENT_SECRET = 'test-client-secret';

defineFeature(feature, (test) => {
  // ── SSO client ──────────────────────────────────────────────────────

  test('Confidential client exchanges a code using HTTP Basic credentials', ({
    given,
    when,
    then,
    and,
  }) => {
    let sso: EveSsoClient;
    let result: SsoTokenResponse;

    given('an SSO client configured with a client id and client secret', () => {
      sso = new EveSsoClient({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      });
    });

    and('the SSO token endpoint returns a token response', () => {
      queueSsoTokenResponse({
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        expiresIn: 1199,
      });
    });

    when(
      /^the client exchanges the authorization code "([^"]+)"$/,
      async (code: string) => {
        result = await sso.exchangeCode(code);
      },
    );

    then(
      'the request shall be a form-encoded POST to the SSO token endpoint',
      () => {
        const [url, init] = fetchMock.mock.calls[0]!;
        expect(String(url)).toBe(SSO_TOKEN_URL);
        expect(init?.method).toBe('POST');
        expect(readHeader(init, 'Content-Type')).toBe(
          'application/x-www-form-urlencoded',
        );
        const body = readFormBody(init);
        expect(body.get('grant_type')).toBe('authorization_code');
        expect(body.get('code')).toBe('abc123');
      },
    );

    and(
      'the request shall carry an HTTP Basic Authorization header for the client id and secret',
      () => {
        const [, init] = fetchMock.mock.calls[0]!;
        const expected =
          'Basic ' +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        expect(readHeader(init, 'Authorization')).toBe(expected);
      },
    );

    and(
      'the result shall contain the access token, refresh token and expiry from the response',
      () => {
        expect(result.accessToken).toBe('access-1');
        expect(result.refreshToken).toBe('refresh-1');
        expect(result.expiresIn).toBe(1199);
      },
    );
  });

  test('Public client exchanges a code using PKCE', ({
    given,
    when,
    then,
    and,
  }) => {
    let sso: EveSsoClient;

    given('an SSO client configured with a client id only', () => {
      sso = new EveSsoClient({ clientId: CLIENT_ID });
    });

    and('the SSO token endpoint returns a token response', () => {
      queueSsoTokenResponse();
    });

    when(
      /^the client exchanges the authorization code "([^"]+)" with a PKCE verifier$/,
      async (code: string) => {
        await sso.exchangeCode(code, { codeVerifier: 'verifier-xyz' });
      },
    );

    then('the request shall carry no Authorization header', () => {
      const [, init] = fetchMock.mock.calls[0]!;
      expect(readHeader(init, 'Authorization')).toBeNull();
    });

    and(
      'the request body shall include the client_id and the code_verifier',
      () => {
        const [, init] = fetchMock.mock.calls[0]!;
        const body = readFormBody(init);
        expect(body.get('client_id')).toBe(CLIENT_ID);
        expect(body.get('code_verifier')).toBe('verifier-xyz');
      },
    );
  });

  test('Refreshing a revoked refresh token throws TokenRevokedError', ({
    given,
    when,
    then,
    and,
  }) => {
    let sso: EveSsoClient;
    let caught: unknown;

    given('an SSO client configured with a client id and client secret', () => {
      sso = new EveSsoClient({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      });
    });

    and(
      /^the SSO token endpoint responds (\d+) with error code "([^"]+)"$/,
      (status: string, code: string) => {
        queueSsoErrorResponse(Number(status), code);
      },
    );

    when(
      /^the client refreshes the refresh token "([^"]+)"$/,
      async (token: string) => {
        try {
          await sso.refresh(token);
        } catch (e) {
          caught = e;
        }
      },
    );

    then('the client shall throw TokenRevokedError', () => {
      expect(caught).toBeInstanceOf(TokenRevokedError);
    });
  });

  test('SSO rate limit response is surfaced with status 429', ({
    given,
    when,
    then,
    and,
  }) => {
    let sso: EveSsoClient;
    let caught: unknown;

    given('an SSO client configured with a client id and client secret', () => {
      sso = new EveSsoClient({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
      });
    });

    and(
      /^the SSO token endpoint responds (\d+) with error code "([^"]+)"$/,
      (status: string, code: string) => {
        queueSsoErrorResponse(Number(status), code);
      },
    );

    when(
      /^the client refreshes the refresh token "([^"]+)"$/,
      async (token: string) => {
        try {
          await sso.refresh(token);
        } catch (e) {
          caught = e;
        }
      },
    );

    then(
      /^the client shall throw SsoError with status (\d+) and error code "([^"]+)"$/,
      (status: string, code: string) => {
        expect(caught).toBeInstanceOf(SsoError);
        expect(caught).not.toBeInstanceOf(TokenRevokedError);
        expect((caught as SsoError).statusCode).toBe(Number(status));
        expect((caught as SsoError).errorCode).toBe(code);
      },
    );
  });

  // ── Token manager: registration ─────────────────────────────────────

  test('Adding a character stores its decoded identity and scopes', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;

    given('a token manager backed by in-memory storage', () => {
      storage = new MemoryTokenStorage();
      manager = new EsiTokenManager({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        storage,
      });
    });

    and(
      /^the SSO token endpoint returns a token for character (\d+) "([^"]+)" with scopes "([^"]+)"$/,
      (id: string, name: string, scopes: string) => {
        queueSsoTokenResponse({
          characterId: Number(id),
          characterName: name,
          scopes: scopes.split(' '),
        });
      },
    );

    when(
      /^the character is added from the authorization code "([^"]+)"$/,
      async (code: string) => {
        await manager.addCharacter(code);
      },
    );

    then(
      /^the storage shall hold a token for character (\d+) named "([^"]+)"$/,
      async (id: string, name: string) => {
        const stored = await storage.get(Number(id));
        expect(stored).not.toBeNull();
        expect(stored!.characterName).toBe(name);
      },
    );

    and(/^the stored scopes shall be "([^"]+)"$/, async (scopes: string) => {
      const stored = await storage.get(DEFAULT_CHARACTER_ID);
      expect(stored!.scopes).toEqual(scopes.split(' '));
    });
  });

  test('Re-authorizing a character replaces the previous token', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;

    given('a token manager backed by in-memory storage', () => {
      storage = new MemoryTokenStorage();
      manager = new EsiTokenManager({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        storage,
      });
    });

    and(
      /^character (\d+) is already stored with refresh token "([^"]+)"$/,
      async (id: string, refreshToken: string) => {
        await storage.set(
          Number(id),
          makeStoredToken({ characterId: Number(id), refreshToken }),
        );
      },
    );

    and(
      /^the SSO token endpoint returns a token for character (\d+) "([^"]+)" with refresh token "([^"]+)"$/,
      (id: string, name: string, refreshToken: string) => {
        queueSsoTokenResponse({
          characterId: Number(id),
          characterName: name,
          refreshToken,
        });
      },
    );

    when(
      /^the character is added from the authorization code "([^"]+)"$/,
      async (code: string) => {
        await manager.addCharacter(code);
      },
    );

    then('the storage shall hold exactly one token', async () => {
      expect(await storage.list()).toHaveLength(1);
    });

    and(
      /^the stored refresh token for character (\d+) shall be "([^"]+)"$/,
      async (id: string, refreshToken: string) => {
        const stored = await storage.get(Number(id));
        expect(stored!.refreshToken).toBe(refreshToken);
      },
    );
  });

  // ── Token manager: getToken ─────────────────────────────────────────

  const managerWithSkew = (storage: MemoryTokenStorage, skewSeconds: number) =>
    new EsiTokenManager({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      storage,
      refreshSkewMs: skewSeconds * 1000,
    });

  test('Token within the skew window is refreshed before it is returned', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let returned: string;

    given(
      /^a token manager backed by in-memory storage with a refresh skew of (\d+) seconds$/,
      (skew: string) => {
        storage = new MemoryTokenStorage();
        manager = managerWithSkew(storage, Number(skew));
      },
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      async (id: string, secs: string) => {
        await storage.set(
          Number(id),
          makeStoredToken({
            characterId: Number(id),
            expiresInSeconds: Number(secs),
          }),
        );
      },
    );

    and(
      /^the SSO token endpoint returns a token for character (\d+) with access token "([^"]+)"$/,
      (id: string, accessToken: string) => {
        queueSsoTokenResponse({ characterId: Number(id), accessToken });
      },
    );

    when(/^a token is requested for character (\d+)$/, async (id: string) => {
      returned = await manager.getToken(Number(id));
    });

    then(
      /^the returned access token shall be "([^"]+)"$/,
      (expected: string) => {
        expect(returned).toBe(expected);
      },
    );

    and(
      /^the SSO token endpoint shall have been called (\d+) times?$/,
      (count: string) => {
        expect(ssoCallCount()).toBe(Number(count));
      },
    );
  });

  test('Token outside the skew window is returned without contacting SSO', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let returned: string;
    let stored: StoredToken;

    given(
      /^a token manager backed by in-memory storage with a refresh skew of (\d+) seconds$/,
      (skew: string) => {
        storage = new MemoryTokenStorage();
        manager = managerWithSkew(storage, Number(skew));
      },
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      async (id: string, secs: string) => {
        stored = makeStoredToken({
          characterId: Number(id),
          expiresInSeconds: Number(secs),
        });
        await storage.set(Number(id), stored);
      },
    );

    when(/^a token is requested for character (\d+)$/, async (id: string) => {
      returned = await manager.getToken(Number(id));
    });

    then('the returned access token shall be the stored access token', () => {
      expect(returned).toBe(stored.accessToken);
    });

    and(
      /^the SSO token endpoint shall have been called (\d+) times?$/,
      (count: string) => {
        expect(ssoCallCount()).toBe(Number(count));
      },
    );
  });

  test('Five concurrent token requests produce a single SSO call', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let returned: string[];

    given(
      /^a token manager backed by in-memory storage with a refresh skew of (\d+) seconds$/,
      (skew: string) => {
        storage = new MemoryTokenStorage();
        manager = managerWithSkew(storage, Number(skew));
      },
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      async (id: string, secs: string) => {
        await storage.set(
          Number(id),
          makeStoredToken({
            characterId: Number(id),
            expiresInSeconds: Number(secs),
          }),
        );
      },
    );

    and(
      /^the SSO token endpoint returns a token for character (\d+) with access token "([^"]+)"$/,
      (id: string, accessToken: string) => {
        // Only one response is queued: a second SSO call would fail on an empty body.
        queueSsoTokenResponse({ characterId: Number(id), accessToken });
      },
    );

    when(
      /^(\d+) tokens are requested concurrently for character (\d+)$/,
      async (count: string, id: string) => {
        returned = await Promise.all(
          Array.from({ length: Number(count) }, () =>
            manager.getToken(Number(id)),
          ),
        );
      },
    );

    then(
      /^every returned access token shall be "([^"]+)"$/,
      (expected: string) => {
        expect(returned).toHaveLength(5);
        for (const token of returned) expect(token).toBe(expected);
      },
    );

    and(
      /^the SSO token endpoint shall have been called (\d+) times?$/,
      (count: string) => {
        expect(ssoCallCount()).toBe(Number(count));
      },
    );
  });

  test('Rotated refresh token is in storage when the refresh resolves', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;

    given(
      /^a token manager backed by in-memory storage with a refresh skew of (\d+) seconds$/,
      (skew: string) => {
        storage = new MemoryTokenStorage();
        manager = managerWithSkew(storage, Number(skew));
      },
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      async (id: string, secs: string) => {
        await storage.set(
          Number(id),
          makeStoredToken({
            characterId: Number(id),
            expiresInSeconds: Number(secs),
          }),
        );
      },
    );

    and(
      /^the SSO token endpoint returns a token for character (\d+) with refresh token "([^"]+)"$/,
      (id: string, refreshToken: string) => {
        queueSsoTokenResponse({ characterId: Number(id), refreshToken });
      },
    );

    when(/^a token is requested for character (\d+)$/, async (id: string) => {
      await manager.getToken(Number(id));
    });

    then(
      /^the stored refresh token for character (\d+) shall be "([^"]+)"$/,
      async (id: string, refreshToken: string) => {
        const stored = await storage.get(Number(id));
        expect(stored!.refreshToken).toBe(refreshToken);
      },
    );
  });

  test('Revoked character is rejected locally on the next request', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    const errors: unknown[] = [];

    given(
      /^a token manager backed by in-memory storage with a refresh skew of (\d+) seconds$/,
      (skew: string) => {
        storage = new MemoryTokenStorage();
        manager = managerWithSkew(storage, Number(skew));
      },
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      async (id: string, secs: string) => {
        await storage.set(
          Number(id),
          makeStoredToken({
            characterId: Number(id),
            expiresInSeconds: Number(secs),
          }),
        );
      },
    );

    and(
      /^the SSO token endpoint responds (\d+) with error code "([^"]+)"$/,
      (status: string, code: string) => {
        queueSsoErrorResponse(Number(status), code);
      },
    );

    when(
      /^a token is requested for character (\d+) and the error is captured$/,
      async (id: string) => {
        try {
          await manager.getToken(Number(id));
        } catch (e) {
          errors.push(e);
        }
      },
    );

    and(
      /^a token is requested again for character (\d+) and the error is captured$/,
      async (id: string) => {
        try {
          await manager.getToken(Number(id));
        } catch (e) {
          errors.push(e);
        }
      },
    );

    then('both requests shall have thrown TokenRevokedError', () => {
      expect(errors).toHaveLength(2);
      expect(errors[0]).toBeInstanceOf(TokenRevokedError);
      expect(errors[1]).toBeInstanceOf(TokenRevokedError);
    });

    and(
      /^the SSO token endpoint shall have been called (\d+) times?$/,
      (count: string) => {
        expect(ssoCallCount()).toBe(Number(count));
      },
    );
  });

  // ── Token manager: client integration ───────────────────────────────

  test('Client created by the manager refreshes through the manager on a 401', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let client: EsiClient;
    let stored: StoredToken;
    let ssoBody: string;
    let wallet: number;

    given(
      /^a token manager backed by in-memory storage with a refresh skew of (\d+) seconds$/,
      (skew: string) => {
        storage = new MemoryTokenStorage();
        manager = managerWithSkew(storage, Number(skew));
      },
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      async (id: string, secs: string) => {
        stored = makeStoredToken({
          characterId: Number(id),
          expiresInSeconds: Number(secs),
        });
        await storage.set(Number(id), stored);
      },
    );

    and(
      /^the SSO token endpoint returns a token for character (\d+) with access token "([^"]+)"$/,
      (id: string, accessToken: string) => {
        ssoBody = ssoTokenBody({ characterId: Number(id), accessToken });
      },
    );

    and(
      /^the ESI endpoint responds 401 to the stored access token and 200 to "([^"]+)"$/,
      (freshToken: string) => {
        fetchMock.mockResponse(async (req) => {
          if (isSsoTokenRequest(req.url)) {
            return {
              body: ssoBody,
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            };
          }
          const auth = req.headers.get('authorization');
          if (auth === `Bearer ${freshToken}`) {
            return {
              body: JSON.stringify(12345.67),
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            };
          }
          return {
            body: JSON.stringify({ error: 'token is expired' }),
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          };
        });
      },
    );

    when(
      /^a client is created for character (\d+) and it fetches the character's wallet$/,
      async (id: string) => {
        client = await manager.createClient(Number(id), {
          enableETagCache: false,
        });
        try {
          wallet = await client.wallet.getCharacterWallet(Number(id));
        } finally {
          client.shutdown();
        }
      },
    );

    then('the wallet request shall succeed', () => {
      expect(wallet).toBe(12345.67);
    });

    and(
      /^the stored access token for character (\d+) shall be "([^"]+)"$/,
      async (id: string, accessToken: string) => {
        const updated = await storage.get(Number(id));
        expect(updated!.accessToken).toBe(accessToken);
        expect(updated!.accessToken).not.toBe(stored.accessToken);
      },
    );
  });

  // ── Bulk refresh ────────────────────────────────────────────────────

  const bulkManager = (storage: MemoryTokenStorage) =>
    new EsiTokenManager({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      storage,
    });

  async function storeMany(
    storage: MemoryTokenStorage,
    count: number,
    expiresInSeconds: number,
  ): Promise<number[]> {
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      const characterId = 90_000_000 + i;
      ids.push(characterId);
      await storage.set(
        characterId,
        makeStoredToken({
          characterId,
          expiresInSeconds,
          refreshToken: `refresh-${characterId}`,
        }),
      );
    }
    return ids;
  }

  function mockDelayedSsoResponses(track: {
    inFlight: number;
    peak: number;
  }): void {
    fetchMock.mockResponse(async (req) => {
      const body = readFormBody({ body: await req.text() });
      const refreshToken = body.get('refresh_token') ?? '';
      const characterId =
        Number(refreshToken.replace('refresh-', '')) || DEFAULT_CHARACTER_ID;
      track.inFlight++;
      track.peak = Math.max(track.peak, track.inFlight);
      await sleep(15);
      track.inFlight--;
      return {
        body: ssoTokenBody({
          characterId,
          accessToken: makeJwt({ characterId }),
        }),
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      };
    });
  }

  test('Twenty tokens refreshed with a limit of three never exceed three in flight', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let results: RefreshResult[];
    const track = { inFlight: 0, peak: 0 };

    given('a token manager backed by in-memory storage', () => {
      storage = new MemoryTokenStorage();
      manager = bulkManager(storage);
    });

    and(
      /^(\d+) characters are stored with access tokens expiring in (\d+) seconds$/,
      async (count: string, secs: string) => {
        await storeMany(storage, Number(count), Number(secs));
      },
    );

    and(
      'the SSO token endpoint returns a token for each refresh after a short delay',
      () => {
        mockDelayedSsoResponses(track);
      },
    );

    when(
      /^refreshAll runs with a concurrency of (\d+)$/,
      async (concurrency: string) => {
        results = await manager.refreshAll({
          concurrency: Number(concurrency),
        });
      },
    );

    then(
      /^the peak number of simultaneous SSO requests shall be at most (\d+)$/,
      (limit: string) => {
        expect(track.peak).toBeGreaterThan(0);
        expect(track.peak).toBeLessThanOrEqual(Number(limit));
      },
    );

    and(/^every result shall have status "([^"]+)"$/, (status: string) => {
      expect(results).toHaveLength(20);
      for (const r of results) expect(r.status).toBe(status);
    });
  });

  test('One revoked token among three is reported while the other two refresh', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let results: RefreshResult[];
    let ids: number[];

    given('a token manager backed by in-memory storage', () => {
      storage = new MemoryTokenStorage();
      manager = bulkManager(storage);
    });

    and(
      /^(\d+) characters are stored with access tokens expiring in (\d+) seconds$/,
      async (count: string, secs: string) => {
        ids = await storeMany(storage, Number(count), Number(secs));
      },
    );

    and(
      "the SSO token endpoint responds invalid_grant for the second character's refresh token",
      () => {
        fetchMock.mockResponse(async (req) => {
          const body = readFormBody({ body: await req.text() });
          const refreshToken = body.get('refresh_token') ?? '';
          if (refreshToken === `refresh-${ids[1]}`) {
            return {
              body: ssoErrorBody('invalid_grant'),
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            };
          }
          const characterId = Number(refreshToken.replace('refresh-', ''));
          return {
            body: ssoTokenBody({ characterId }),
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          };
        });
      },
    );

    when(
      /^refreshAll runs with a concurrency of (\d+)$/,
      async (concurrency: string) => {
        results = await manager.refreshAll({
          concurrency: Number(concurrency),
        });
      },
    );

    then(
      /^the result for the second character shall have status "([^"]+)"$/,
      (status: string) => {
        const second = results.find((r) => r.characterId === ids[1]);
        expect(second?.status).toBe(status);
      },
    );

    and(
      /^the results for the other characters shall have status "([^"]+)"$/,
      (status: string) => {
        const others = results.filter((r) => r.characterId !== ids[1]);
        expect(others).toHaveLength(2);
        for (const r of others) expect(r.status).toBe(status);
      },
    );
  });

  test('SSO 429 during bulk refresh yields a retryable failure', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let results: RefreshResult[];
    let ids: number[];

    given('a token manager backed by in-memory storage', () => {
      storage = new MemoryTokenStorage();
      manager = bulkManager(storage);
    });

    and(
      /^(\d+) character is stored with an access token expiring in (\d+) seconds$/,
      async (count: string, secs: string) => {
        ids = await storeMany(storage, Number(count), Number(secs));
      },
    );

    and(
      /^the SSO token endpoint responds (\d+) with error code "([^"]+)"$/,
      (status: string, code: string) => {
        queueSsoErrorResponse(Number(status), code);
      },
    );

    when(
      /^refreshAll runs with a concurrency of (\d+)$/,
      async (concurrency: string) => {
        results = await manager.refreshAll({
          concurrency: Number(concurrency),
        });
      },
    );

    then(
      /^the result for the first character shall have status "([^"]+)" and be retryable$/,
      (status: string) => {
        const first = results.find((r) => r.characterId === ids[0]);
        expect(first?.status).toBe(status);
        expect(first?.retryable).toBe(true);
        expect(first?.error).toBeInstanceOf(SsoError);
      },
    );
  });

  test('Only the token inside the five-minute window is refreshed', ({
    given,
    when,
    then,
    and,
  }) => {
    let storage: MemoryTokenStorage;
    let manager: EsiTokenManager;
    let results: RefreshResult[];
    const track = { inFlight: 0, peak: 0 };

    given('a token manager backed by in-memory storage', () => {
      storage = new MemoryTokenStorage();
      manager = bulkManager(storage);
    });

    const storeOne = async (id: string, secs: string) => {
      const characterId = Number(id);
      await storage.set(
        characterId,
        makeStoredToken({
          characterId,
          expiresInSeconds: Number(secs),
          refreshToken: `refresh-${characterId}`,
        }),
      );
    };

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      storeOne,
    );

    and(
      /^character (\d+) is stored with an access token expiring in (\d+) seconds$/,
      storeOne,
    );

    and(
      'the SSO token endpoint returns a token for each refresh after a short delay',
      () => {
        mockDelayedSsoResponses(track);
      },
    );

    when(
      /^refreshAll runs with an expiringWithinMs of (\d+)$/,
      async (ms: string) => {
        results = await manager.refreshAll({ expiringWithinMs: Number(ms) });
      },
    );

    then(
      /^the result for character (\d+) shall have status "([^"]+)"$/,
      (id: string, status: string) => {
        expect(results.find((r) => r.characterId === Number(id))?.status).toBe(
          status,
        );
      },
    );

    and(
      /^the result for character (\d+) shall have status "([^"]+)"$/,
      (id: string, status: string) => {
        expect(results.find((r) => r.characterId === Number(id))?.status).toBe(
          status,
        );
      },
    );

    and(
      /^the SSO token endpoint shall have been called (\d+) times?$/,
      (count: string) => {
        expect(ssoCallCount()).toBe(Number(count));
      },
    );
  });

  // ── File storage ────────────────────────────────────────────────────

  test('Tokens written by one instance are read back by another', ({
    given,
    when,
    then,
    and,
  }) => {
    let dir: string;
    let filePath: string;
    let first: FileTokenStorage;
    let second: FileTokenStorage;

    afterAll(() => {
      fs.rmSync(dir, { recursive: true, force: true });
    });

    given('a file token storage on a temporary path', () => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esi-tokens-'));
      filePath = path.join(dir, 'tokens.json');
      first = new FileTokenStorage(filePath);
    });

    and(
      /^a token for character (\d+) is written to it$/,
      async (id: string) => {
        await first.set(
          Number(id),
          makeStoredToken({ characterId: Number(id) }),
        );
      },
    );

    when('a second file token storage is opened on the same path', () => {
      second = new FileTokenStorage(filePath);
    });

    then(
      /^the second storage shall return the token for character (\d+)$/,
      async (id: string) => {
        const token = await second.get(Number(id));
        expect(token?.characterId).toBe(Number(id));
        expect(token?.refreshToken).toBe(`refresh-${id}`);
      },
    );

    and(
      /^the second storage shall list exactly (\d+) token$/,
      async (count: string) => {
        expect(await second.list()).toHaveLength(Number(count));
      },
    );
  });
});
