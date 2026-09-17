import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileTokenStorage } from '../../../src/auth/storage/FileTokenStorage';
import { makeStoredToken } from '../helpers/ssoFixtures';
import type { StoredToken } from '../../../src/auth/types';

// File modes are a POSIX concept: Windows ignores the requested mode.
const IS_WINDOWS = process.platform === 'win32';
const describeOnPosix = IS_WINDOWS ? describe.skip : describe;
const describeOnWindows = IS_WINDOWS ? describe : describe.skip;

describe('FileTokenStorage', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esi-file-storage-'));
    file = path.join(dir, 'nested', 'tokens.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('resolves the path and reads an absent file as empty', async () => {
    const storage = new FileTokenStorage(file);
    expect(path.isAbsolute(storage.path)).toBe(true);
    expect(await storage.list()).toEqual([]);
    expect(await storage.get(1)).toBeNull();
    expect(fs.existsSync(file)).toBe(false);
  });

  it('creates parent directories and writes a versioned JSON document', async () => {
    const storage = new FileTokenStorage(file);
    const token = makeStoredToken({ characterId: 3 });
    await storage.set(3, token);
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      version: number;
      tokens: Record<string, unknown>;
    };
    expect(parsed.version).toBe(1);
    expect(Object.keys(parsed.tokens)).toEqual(['3']);
    expect(fs.readdirSync(path.dirname(file))).toEqual(['tokens.json']);
  });

  describeOnPosix('on POSIX platforms', () => {
    it('applies the requested file mode', async () => {
      const storage = new FileTokenStorage(file, { mode: 0o640 });
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      expect(fs.statSync(file).mode & 0o777).toBe(0o640);
    });
  });

  describeOnWindows('on Windows', () => {
    it('writes the file despite the requested mode', async () => {
      const storage = new FileTokenStorage(file, { mode: 0o640 });
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  it('round-trips through a second instance', async () => {
    const first = new FileTokenStorage(file);
    await first.set(1, makeStoredToken({ characterId: 1, refreshToken: 'r1' }));
    await first.set(2, makeStoredToken({ characterId: 2, refreshToken: 'r2' }));
    const second = new FileTokenStorage(file);
    expect((await second.get(2))!.refreshToken).toBe('r2');
    expect((await second.list()).map((t) => t.characterId).sort()).toEqual([
      1, 2,
    ]);
  });

  it('deletes and persists the deletion', async () => {
    const storage = new FileTokenStorage(file);
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    await storage.delete(1);
    await storage.delete(42);
    expect(await storage.get(1)).toBeNull();
    expect(await new FileTokenStorage(file).list()).toEqual([]);
  });

  it('returns copies rather than the cached objects', async () => {
    const storage = new FileTokenStorage(file);
    await storage.set(1, makeStoredToken({ characterId: 1, scopes: ['a'] }));
    const got = (await storage.get(1))!;
    got.scopes.push('b');
    got.refreshToken = 'tampered';
    expect((await storage.get(1))!.scopes).toEqual(['a']);
    const listed = await storage.list();
    listed[0]!.scopes.push('c');
    expect((await storage.list())[0]!.scopes).toEqual(['a']);
  });

  it('re-reads the file after invalidate', async () => {
    const storage = new FileTokenStorage(file);
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    const other = new FileTokenStorage(file);
    await other.set(2, makeStoredToken({ characterId: 2 }));
    // The first instance still serves its cached view...
    expect(await storage.get(2)).toBeNull();
    storage.invalidate();
    // ...until invalidated, after which it re-reads the file.
    expect(await storage.get(2)).not.toBeNull();
  });

  it('ignores malformed entries in an existing file', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        tokens: {
          '1': makeStoredToken({ characterId: 1 }),
          bad: { characterId: 'nope' },
          nul: null,
        },
      }),
    );
    const storage = new FileTokenStorage(file);
    expect((await storage.list()).map((t) => t.characterId)).toEqual([1]);
  });

  it('treats a file without a tokens map as empty', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ version: 1 }));
    expect(await new FileTokenStorage(file).list()).toEqual([]);
  });

  it('propagates read errors other than ENOENT', async () => {
    fs.mkdirSync(file, { recursive: true }); // a directory where the file should be
    const storage = new FileTokenStorage(file);
    await expect(storage.list()).rejects.toThrow();
  });

  it('serialises overlapping writes so the last write wins', async () => {
    const storage = new FileTokenStorage(file);
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        storage.set(i, makeStoredToken({ characterId: i })),
      ),
    );
    const reread = new FileTokenStorage(file);
    expect(await reread.list()).toHaveLength(10);
  });

  it('ignores numeric-id entries that are missing or mistyping required fields', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const noScopes: Partial<StoredToken> = makeStoredToken({ characterId: 2 });
    delete noScopes.scopes;
    const badScopes = { ...makeStoredToken({ characterId: 3 }), scopes: 'esi' };
    const noRefresh: Partial<StoredToken> = makeStoredToken({ characterId: 4 });
    delete noRefresh.refreshToken;
    const badExpiry = {
      ...makeStoredToken({ characterId: 5 }),
      expiresAt: '1',
    };
    fs.writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        tokens: {
          '1': makeStoredToken({ characterId: 1 }),
          '2': noScopes,
          '3': badScopes,
          '4': noRefresh,
          '5': badExpiry,
        },
      }),
    );
    const storage = new FileTokenStorage(file);
    expect((await storage.list()).map((t) => t.characterId)).toEqual([1]);
    expect(await storage.get(2)).toBeNull();
    expect(await storage.get(3)).toBeNull();
  });

  it('keeps optional fields when present and valid', async () => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const revoked = makeStoredToken({ characterId: 9, revokedAt: 123 });
    fs.writeFileSync(
      file,
      JSON.stringify({ version: 1, tokens: { '9': revoked } }),
    );
    const stored = await new FileTokenStorage(file).get(9);
    expect(stored?.revokedAt).toBe(123);
    expect(stored?.ownerHash).toBe('owner-hash');
  });

  it('does not let a read that began before invalidate repopulate the cache', async () => {
    const storage = new FileTokenStorage(file);
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    storage.invalidate();

    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const original = fs.promises.readFile.bind(fs.promises);
    const spy = jest
      .spyOn(fs.promises, 'readFile')
      .mockImplementationOnce((async (
        ...args: Parameters<typeof fs.promises.readFile>
      ) => {
        const data = await original(...args);
        await gate;
        return data;
      }) as never);
    try {
      const stale = storage.list();
      await new Promise((r) => setTimeout(r, 5));
      storage.invalidate();
      await new FileTokenStorage(file).set(
        2,
        makeStoredToken({ characterId: 2 }),
      );
      release();
      expect(await stale).toHaveLength(1);
      expect(await storage.list()).toHaveLength(2);
    } finally {
      spy.mockRestore();
    }
  });
});
