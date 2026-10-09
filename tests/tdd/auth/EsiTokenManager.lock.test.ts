import fetchMock from 'jest-fetch-mock';
import { EsiTokenManager } from '../../../src/auth/EsiTokenManager';
import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import { TokenRevokedError } from '../../../src/auth/errors';
import type { ILogger } from '../../../src/core/logger/ILogger';
import type { ITokenStorage, StoredToken } from '../../../src/auth/types';
import {
  makeStoredToken,
  ssoCallCount,
  ssoTokenBody,
} from '../helpers/ssoFixtures';

const ID = 2114794365;

const logger = (): ILogger & { debug: jest.Mock } => ({
  fatal: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
});

/**
 * A MemoryTokenStorage with a lease. `beforeFn` runs once the lease is held
 * and before `fn`, standing in for another process that got there first.
 */
function lockedStorage(
  beforeFn?: (inner: MemoryTokenStorage) => Promise<void>,
) {
  const inner = new MemoryTokenStorage();
  const calls: number[] = [];
  const storage: ITokenStorage = {
    get: (id) => inner.get(id),
    set: (id, token) => inner.set(id, token),
    delete: (id) => inner.delete(id),
    list: () => inner.list(),
    withLock: async <T>(id: number, fn: () => Promise<T>): Promise<T> => {
      calls.push(id);
      await beforeFn?.(inner);
      return fn();
    },
  };
  return { inner, storage, calls };
}

const stale = (overrides: Partial<StoredToken> = {}): StoredToken => ({
  ...makeStoredToken({ characterId: ID, expiresInSeconds: 10 }),
  ...overrides,
});

describe('EsiTokenManager with a storage lock', () => {
  it('refreshes inside the lock for the character being refreshed', async () => {
    const { inner, storage, calls } = lockedStorage();
    await inner.set(ID, stale());
    fetchMock.mockResponseOnce(
      ssoTokenBody({ characterId: ID, refreshToken: 'rotated' }),
    );
    const m = new EsiTokenManager({
      clientId: 'cid',
      storage,
      logger: logger(),
    });

    const result = await m.refresh(ID);

    expect(calls).toEqual([ID]);
    expect(result.refreshToken).toBe('rotated');
    expect((await inner.get(ID))!.refreshToken).toBe('rotated');
    expect(ssoCallCount()).toBe(1);
  });

  it('returns the token another holder rotated without calling SSO', async () => {
    const rotated = stale({
      refreshToken: 'other',
      accessToken: 'other-access',
    });
    const { inner, storage } = lockedStorage((store) => store.set(ID, rotated));
    await inner.set(ID, stale());
    const log = logger();
    const onRefresh = jest.fn();
    const m = new EsiTokenManager({
      clientId: 'cid',
      storage,
      logger: log,
      onRefresh,
    });

    const result = await m.refresh(ID);

    expect(result.accessToken).toBe('other-access');
    expect(ssoCallCount()).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
    expect(log.debug).toHaveBeenCalledWith(
      expect.stringContaining('rotated by another holder'),
    );
  });

  it('rejects with TokenRevokedError when another holder recorded a revocation', async () => {
    const { inner, storage } = lockedStorage((store) =>
      store.set(ID, stale({ revokedAt: 1 })),
    );
    await inner.set(ID, stale());
    const m = new EsiTokenManager({
      clientId: 'cid',
      storage,
      logger: logger(),
    });

    await expect(m.refresh(ID)).rejects.toBeInstanceOf(TokenRevokedError);
    expect(ssoCallCount()).toBe(0);
  });

  it('propagates a lock failure without calling SSO', async () => {
    const inner = new MemoryTokenStorage();
    await inner.set(ID, stale());
    const storage: ITokenStorage = {
      get: (id) => inner.get(id),
      set: (id, token) => inner.set(id, token),
      delete: (id) => inner.delete(id),
      list: () => inner.list(),
      withLock: () => Promise.reject(new Error('lock timed out')),
    };
    const m = new EsiTokenManager({
      clientId: 'cid',
      storage,
      logger: logger(),
    });

    await expect(m.refresh(ID)).rejects.toThrow('lock timed out');
    expect(ssoCallCount()).toBe(0);
  });

  it('compares against the stale record getToken read, not a later read', async () => {
    // Another process rotates the token after getToken judged it stale but
    // before the refresh reads it: every read after the first sees the rotation.
    const inner = new MemoryTokenStorage();
    await inner.set(ID, stale());
    const rotated = makeStoredToken({
      characterId: ID,
      refreshToken: 'other',
      accessToken: 'other-access',
    });
    let reads = 0;
    const storage: ITokenStorage = {
      get: async (id) => {
        reads++;
        if (reads === 2) await inner.set(ID, rotated);
        return inner.get(id);
      },
      set: (id, token) => inner.set(id, token),
      delete: (id) => inner.delete(id),
      list: () => inner.list(),
      withLock: <T>(_id: number, fn: () => Promise<T>): Promise<T> => fn(),
    };
    const m = new EsiTokenManager({
      clientId: 'cid',
      storage,
      logger: logger(),
    });

    expect(await m.getToken(ID)).toBe('other-access');
    expect(ssoCallCount()).toBe(0);
  });

  it('passes each listed record to the lock check during a bulk refresh', async () => {
    const rotated = stale({
      refreshToken: 'other',
      accessToken: 'other-access',
    });
    const { inner, storage } = lockedStorage((store) => store.set(ID, rotated));
    await inner.set(ID, stale());
    const m = new EsiTokenManager({
      clientId: 'cid',
      storage,
      logger: logger(),
    });

    const [result] = await m.refreshAll();

    expect(result).toMatchObject({ characterId: ID, status: 'refreshed' });
    expect(ssoCallCount()).toBe(0);
  });
});
