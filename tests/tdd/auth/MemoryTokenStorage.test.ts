import { MemoryTokenStorage } from '../../../src/auth/storage/MemoryTokenStorage';
import { makeStoredToken } from '../helpers/ssoFixtures';

describe('MemoryTokenStorage', () => {
  it('starts empty', async () => {
    const storage = new MemoryTokenStorage();
    expect(await storage.list()).toEqual([]);
    expect(await storage.get(1)).toBeNull();
    expect(storage.size).toBe(0);
  });

  it('seeds from an initial list', async () => {
    const storage = new MemoryTokenStorage([
      makeStoredToken({ characterId: 1 }),
      makeStoredToken({ characterId: 2 }),
    ]);
    expect(storage.size).toBe(2);
    expect((await storage.get(2))?.characterId).toBe(2);
  });

  it('round-trips a token by character id', async () => {
    const storage = new MemoryTokenStorage();
    const token = makeStoredToken({ characterId: 5 });
    await storage.set(5, token);
    expect(await storage.get(5)).toEqual(token);
    expect(await storage.list()).toEqual([token]);
  });

  it('returns copies so callers cannot mutate stored state', async () => {
    const storage = new MemoryTokenStorage();
    const token = makeStoredToken({ characterId: 5, scopes: ['a'] });
    await storage.set(5, token);
    token.scopes.push('mutated-input');
    const first = (await storage.get(5))!;
    first.scopes.push('mutated-output');
    first.accessToken = 'changed';
    const second = (await storage.get(5))!;
    expect(second.scopes).toEqual(['a']);
    expect(second.accessToken).toBe(token.accessToken);
    const listed = await storage.list();
    listed[0]!.scopes.push('x');
    expect((await storage.get(5))!.scopes).toEqual(['a']);
  });

  it('replaces an existing entry for the same character', async () => {
    const storage = new MemoryTokenStorage();
    await storage.set(
      5,
      makeStoredToken({ characterId: 5, refreshToken: 'one' }),
    );
    await storage.set(
      5,
      makeStoredToken({ characterId: 5, refreshToken: 'two' }),
    );
    expect(storage.size).toBe(1);
    expect((await storage.get(5))!.refreshToken).toBe('two');
  });

  it('deletes and tolerates deleting unknown ids', async () => {
    const storage = new MemoryTokenStorage();
    await storage.set(5, makeStoredToken({ characterId: 5 }));
    await storage.delete(5);
    await storage.delete(999);
    expect(await storage.get(5)).toBeNull();
  });

  it('clears every token', async () => {
    const storage = new MemoryTokenStorage([
      makeStoredToken({ characterId: 1 }),
    ]);
    storage.clear();
    expect(storage.size).toBe(0);
  });
});
