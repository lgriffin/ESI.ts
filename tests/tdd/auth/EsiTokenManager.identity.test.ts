import fetchMock from 'jest-fetch-mock';
import { EsiTokenManager } from '../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import type { StoredToken } from '../../../src/auth/types';

fetchMock.enableMocks();

const CHARACTER_ID = 95465499;

function stored(overrides: Partial<StoredToken> = {}): StoredToken {
  return {
    characterId: CHARACTER_ID,
    characterName: 'Pilot',
    accessToken: 'stored-token',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 20 * 60_000,
    scopes: [],
    updatedAt: Date.now(),
    ...overrides,
  };
}

function ssoToken(accessToken: string): string {
  const b64 = (s: string) => Buffer.from(s).toString('base64url');
  const jwt = [
    b64(JSON.stringify({ alg: 'RS256' })),
    b64(
      JSON.stringify({
        sub: `CHARACTER:EVE:${CHARACTER_ID}`,
        name: 'Pilot',
        scp: [],
        exp: Math.floor(Date.now() / 1000) + 1199,
      }),
    ),
    b64('sig'),
  ].join('.');
  return JSON.stringify({
    access_token: accessToken === 'jwt' ? jwt : accessToken,
    refresh_token: 'rotated',
    expires_in: 1199,
    token_type: 'Bearer',
  });
}

describe('EsiTokenManager.identity', () => {
  let storage: MemoryTokenStorage;
  let manager: EsiTokenManager;

  beforeEach(async () => {
    fetchMock.resetMocks();
    storage = new MemoryTokenStorage();
    manager = new EsiTokenManager({ clientId: 'app', storage });
    await storage.set(CHARACTER_ID, stored());
  });

  it('names the character', () => {
    expect(manager.identity(CHARACTER_ID).characterId).toBe(CHARACTER_ID);
  });

  it('hands out the stored token while it is fresh', async () => {
    await expect(manager.identity(CHARACTER_ID).accessToken()).resolves.toBe(
      'stored-token',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refreshes a stale token before handing it out', async () => {
    await storage.set(CHARACTER_ID, stored({ expiresAt: Date.now() + 30_000 }));
    fetchMock.mockResponseOnce(ssoToken('jwt'), {
      headers: { 'content-type': 'application/json' },
    });

    const token = await manager.identity(CHARACTER_ID).accessToken();

    expect(token).not.toBe('stored-token');
    expect(token.split('.')).toHaveLength(3);
  });

  it('refreshes through SSO when asked after a 401', async () => {
    fetchMock.mockResponseOnce(ssoToken('jwt'), {
      headers: { 'content-type': 'application/json' },
    });

    const token = await manager.identity(CHARACTER_ID).refreshAccessToken!();

    expect(token).not.toBe('stored-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fails at the request, not at construction, for an unknown character', async () => {
    const identity = manager.identity(1);
    await expect(identity.accessToken()).rejects.toThrow(/character 1/i);
  });

  it('hands out one identity per character, so esi.as() keeps one view', () => {
    expect(manager.identity(CHARACTER_ID)).toBe(manager.identity(CHARACTER_ID));
    expect(manager.identity(CHARACTER_ID)).not.toBe(
      manager.identity(CHARACTER_ID + 1),
    );
  });

  it('is frozen', () => {
    expect(Object.isFrozen(manager.identity(CHARACTER_ID))).toBe(true);
  });
});
