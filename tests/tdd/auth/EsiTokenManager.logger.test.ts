/**
 * EsiTokenManager resolves its fallback logger at each log call (#296), so a
 * global `setLogger()` made after construction still reaches it.
 */
import { EsiTokenManager } from '../../../src/auth/EsiTokenManager';
import type { EveSsoClient } from '../../../src/auth/EveSsoClient';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import { getLogger, setLogger } from '../../../src/core/logger/loggerUtil';
import { makeStoredToken } from '../helpers/ssoFixtures';
import { spyLogger } from '../helpers/spyLogger';

describe('EsiTokenManager logger', () => {
  const original = getLogger();
  let global: ReturnType<typeof spyLogger>;

  beforeEach(() => {
    global = spyLogger();
    setLogger(global);
  });

  afterEach(() => setLogger(original));

  const failingSso = {
    refresh: () => Promise.reject(new Error('sso down')),
  } as unknown as EveSsoClient;

  it('reaches a global logger installed after it was constructed', async () => {
    setLogger(original);
    const storage = new MemoryTokenStorage();
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    const manager = new EsiTokenManager({
      clientId: 'cid',
      storage,
      ssoClient: failingSso,
    });
    const later = spyLogger();
    setLogger(later);

    await expect(manager.refresh(1)).rejects.toThrow('sso down');

    expect(later.error).toHaveBeenCalledWith(
      'Token refresh failed for character 1: sso down',
    );
  });

  it('keeps using a logger passed in its config', async () => {
    const own = spyLogger();
    const storage = new MemoryTokenStorage();
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    const manager = new EsiTokenManager({
      clientId: 'cid',
      storage,
      ssoClient: failingSso,
      logger: own,
    });

    await expect(manager.refresh(1)).rejects.toThrow('sso down');

    expect(own.error).toHaveBeenCalledTimes(1);
    expect(global.error).not.toHaveBeenCalled();
  });

  it('redacts a URL in an SSO error message before it reaches the logger', async () => {
    const storage = new MemoryTokenStorage();
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    const manager = new EsiTokenManager({
      clientId: 'cid',
      storage,
      ssoClient: {
        refresh: () =>
          Promise.reject(
            new Error('see https://login.example/?code=abc&state=1'),
          ),
      } as unknown as EveSsoClient,
    });
    const later = spyLogger();
    setLogger(later);

    await expect(manager.refresh(1)).rejects.toThrow();

    expect(later.error.mock.calls[0]?.[0]).toBe(
      'Token refresh failed for character 1: see https://login.example/?code=%5BREDACTED%5D&state=1',
    );
  });
});
