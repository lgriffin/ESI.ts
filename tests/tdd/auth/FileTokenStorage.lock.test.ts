import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { FileTokenStorage } from '../../../src/auth/storage/FileTokenStorage';
import type { FileTokenStorageLockOptions } from '../../../src';
import { makeStoredToken } from '../helpers/ssoFixtures';

describe('FileTokenStorage with locking', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'esi-file-lock-'));
    file = path.join(dir, 'tokens.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const writeLock = (body: unknown): void =>
    fs.writeFileSync(`${file}.lock`, JSON.stringify(body));

  it('has no withLock unless locking is enabled', () => {
    expect(new FileTokenStorage(file).withLock).toBeUndefined();
    expect(
      new FileTokenStorage(file, { lock: false }).withLock,
    ).toBeUndefined();
    expect(typeof new FileTokenStorage(file, { lock: true }).withLock).toBe(
      'function',
    );
  });

  it('names the lock file next to the token file', () => {
    expect(new FileTokenStorage(file).lockPath).toBe(`${file}.lock`);
  });

  it('holds the lock file while fn runs and removes it afterwards', async () => {
    const storage = new FileTokenStorage(file, { lock: true });
    let during: string[] = [];
    await storage.withLock!(1, () => {
      during = fs.readdirSync(dir);
      return Promise.resolve();
    });
    expect(during).toEqual(['tokens.json.1.lock']);
    expect(fs.readdirSync(dir)).toEqual([]);
  });

  it('lets get and set inside withLock run without waiting for the lock', async () => {
    const storage = new FileTokenStorage(file, {
      lock: { timeoutMs: 200, retryMs: 5 },
    });
    const result = await storage.withLock!(1, async () => {
      await storage.set(1, makeStoredToken({ characterId: 1 }));
      return (await storage.get(1))!.characterId;
    });
    expect(result).toBe(1);
  });

  it('releases the lock when fn rejects', async () => {
    const storage = new FileTokenStorage(file, { lock: true });
    await expect(
      storage.withLock!(1, () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    expect(fs.existsSync(`${file}.lock`)).toBe(false);
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    expect(await storage.list()).toHaveLength(1);
  });

  it('runs callers in one process one at a time', async () => {
    const storage = new FileTokenStorage(file, { lock: { retryMs: 5 } });
    const order: string[] = [];
    const turn = (name: string) =>
      storage.withLock!(1, async () => {
        order.push(`${name}:start`);
        await new Promise((r) => setTimeout(r, 10));
        order.push(`${name}:end`);
      });
    await Promise.all([turn('a'), turn('b')]);
    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });

  it('reads writes made by another instance without invalidate()', async () => {
    const reader = new FileTokenStorage(file, { lock: true });
    expect(await reader.get(1)).toBeNull();
    await new FileTokenStorage(file, { lock: true }).set(
      1,
      makeStoredToken({ characterId: 1, refreshToken: 'from-other' }),
    );
    expect((await reader.get(1))!.refreshToken).toBe('from-other');
  });

  it('deletes under the lock and keeps other entries', async () => {
    const storage = new FileTokenStorage(file, { lock: true });
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    await storage.set(2, makeStoredToken({ characterId: 2 }));
    await storage.delete(1);
    await storage.delete(99);
    expect((await storage.list()).map((t) => t.characterId)).toEqual([2]);
  });

  it('breaks a lock file whose body is not a lock', async () => {
    fs.writeFileSync(`${file}.lock`, 'not json');
    const storage = new FileTokenStorage(file, {
      lock: { timeoutMs: 500, retryMs: 5 },
    });
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    expect(fs.readdirSync(dir)).toEqual(['tokens.json']);
  });

  it('waits for a live lock to be released', async () => {
    writeLock({ pid: 1, nonce: 'other', acquiredAt: Date.now() });
    const lock: FileTokenStorageLockOptions = { timeoutMs: 2_000, retryMs: 5 };
    const storage = new FileTokenStorage(file, { lock });
    const write = storage.set(1, makeStoredToken({ characterId: 1 }));
    await new Promise((r) => setTimeout(r, 30));
    expect(fs.existsSync(file)).toBe(false);
    fs.unlinkSync(`${file}.lock`);
    await write;
    expect(await storage.list()).toHaveLength(1);
  });

  it('does not remove a lock another holder took over', async () => {
    const storage = new FileTokenStorage(file, { lock: true });
    await storage.withLock!(1, () => {
      writeLock({ pid: 1, nonce: 'usurper', acquiredAt: Date.now() });
      return Promise.resolve();
    });
    const left = JSON.parse(fs.readFileSync(`${file}.lock`, 'utf8')) as {
      nonce: string;
    };
    expect(left.nonce).toBe('usurper');
  });

  it.each([
    ['staleMs', Number.NaN],
    ['timeoutMs', Number.POSITIVE_INFINITY],
    ['retryMs', -1],
    ['timeoutMs', 0],
  ] as const)('rejects lock.%s = %p', (name, value) => {
    expect(
      () => new FileTokenStorage(file, { lock: { [name]: value } }),
    ).toThrow(RangeError);
  });

  it('runs refreshes for different characters at the same time', async () => {
    const storage = new FileTokenStorage(file, { lock: { retryMs: 5 } });
    let inside = 0;
    let most = 0;
    const turn = (id: number) =>
      storage.withLock!(id, async () => {
        inside++;
        most = Math.max(most, inside);
        await new Promise((r) => setTimeout(r, 20));
        inside--;
      });
    await Promise.all([turn(1), turn(2)]);
    expect(most).toBe(2);
  });

  it('takes the write lock for a set inside a character lock', async () => {
    const storage = new FileTokenStorage(file, {
      lock: { timeoutMs: 60, retryMs: 5 },
    });
    await storage.withLock!(1, async () => {
      writeLock({ pid: 1, nonce: 'writer', acquiredAt: Date.now() });
      await expect(
        storage.set(1, makeStoredToken({ characterId: 1 })),
      ).rejects.toThrow(`${file}.lock`);
    });
  });

  it('counts time queued behind another caller in this process towards timeoutMs', async () => {
    const storage = new FileTokenStorage(file, {
      lock: { timeoutMs: 50, retryMs: 5 },
    });
    let release!: () => void;
    const first = storage.withLock!(
      1,
      () => new Promise<void>((r) => (release = r)),
    );
    const second = storage.withLock!(1, () => Promise.resolve('ran'));
    await new Promise((r) => setTimeout(r, 80));
    release();
    await first;
    await expect(second).rejects.toThrow('tokens.json.1.lock');
  });

  it('removes a guard file left by a crash', async () => {
    writeLock({ pid: 1, nonce: 'dead', acquiredAt: 0 });
    fs.writeFileSync(
      `${file}.lock.break`,
      JSON.stringify({ pid: 1, nonce: 'dead-guard', acquiredAt: 0 }),
    );
    const storage = new FileTokenStorage(file, {
      lock: { staleMs: 1_000, timeoutMs: 1_000, retryMs: 5 },
    });
    await storage.set(1, makeStoredToken({ characterId: 1 }));
    expect(fs.readdirSync(dir)).toEqual(['tokens.json']);
  });

  it('keeps a live lock while another process holds the guard', async () => {
    writeLock({ pid: 1, nonce: 'dead', acquiredAt: 0 });
    fs.writeFileSync(
      `${file}.lock.break`,
      JSON.stringify({ pid: 1, nonce: 'busy', acquiredAt: Date.now() }),
    );
    const storage = new FileTokenStorage(file, {
      lock: { staleMs: 1_000, timeoutMs: 60, retryMs: 5 },
    });
    await expect(
      storage.set(1, makeStoredToken({ characterId: 1 })),
    ).rejects.toThrow('.lock.break');
    expect(fs.existsSync(`${file}.lock`)).toBe(true);
  });
});
