/* eslint-disable security/detect-non-literal-fs-filename -- every path here is the token file the caller configured, or a sibling of it */
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { systemClock } from '../../core/clock';
import type { ITokenStorage, StoredToken } from '../types';

const FILE_FORMAT_VERSION = 1;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

/**
 * Accept a persisted entry only when it has the full StoredToken shape. A
 * partially corrupt record (a numeric id but no scopes, say) would otherwise
 * be cached and crash the first get() or list() that copies it.
 */
function isStoredToken(value: unknown): value is StoredToken {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.characterId === 'number' &&
    typeof t.characterName === 'string' &&
    typeof t.accessToken === 'string' &&
    typeof t.refreshToken === 'string' &&
    typeof t.expiresAt === 'number' &&
    typeof t.updatedAt === 'number' &&
    isStringArray(t.scopes) &&
    (t.ownerHash === undefined || typeof t.ownerHash === 'string') &&
    (t.revokedAt === undefined || typeof t.revokedAt === 'number')
  );
}

interface TokenFile {
  version: number;
  tokens: Record<string, StoredToken>;
}

export interface FileTokenStorageLockOptions {
  /**
   * A lock file older than this, in milliseconds, is taken to belong to a
   * holder that crashed, and is broken. It must exceed the longest time a
   * holder keeps the lock, which for a refresh is one SSO round trip plus a
   * file write. Defaults to 30 000.
   */
  staleMs?: number | undefined;
  /**
   * How long a write or refresh waits for the lock before rejecting, in
   * milliseconds, counted from the call, so time queued behind other callers
   * in this process counts too. Defaults to 60 000, so a waiter outlasts a
   * crashed holder's lock.
   */
  timeoutMs?: number | undefined;
  /** Pause between attempts to take the lock, in milliseconds. Defaults to 25. */
  retryMs?: number | undefined;
}

export interface FileTokenStorageOptions {
  /**
   * POSIX permission bits for the token file. Defaults to `0o600` (owner
   * read/write only). Ignored on platforms without POSIX modes.
   */
  mode?: number | undefined;
  /**
   * Share the file between processes. Every write then runs under an
   * advisory lock file next to the token file (`<path>.lock`), every refresh
   * by an `EsiTokenManager` under one per character
   * (`<path>.<characterId>.lock`), and reads go to the file rather than an
   * in-memory copy. `true` uses the default timings. Off by default.
   *
   * @throws RangeError when a timing is not a positive, finite number
   */
  lock?: boolean | FileTokenStorageLockOptions | undefined;
}

function lockTiming(
  name: keyof FileTokenStorageLockOptions,
  value: number | undefined,
  fallback: number,
): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `FileTokenStorage lock.${name} must be a positive, finite number of milliseconds; got ${value}`,
    );
  }
  return value;
}

interface LockFileBody {
  pid: number;
  nonce: string;
  acquiredAt: number;
}

/**
 * JSON-file {@link ITokenStorage}.
 *
 * Writes go to a sibling temporary file that is renamed over the target, so a
 * crash mid-write leaves the previous file intact. Writes are serialised
 * within the process. Without the `lock` option, two processes sharing one
 * file are not supported: each would rotate refresh tokens the other cannot
 * see. With it, the storage provides {@link ITokenStorage.withLock} and the
 * processes take turns.
 */
export class FileTokenStorage implements ITokenStorage {
  private readonly filePath: string;
  private readonly mode: number;
  private readonly lockOptions: {
    staleMs: number;
    timeoutMs: number;
    retryMs: number;
  } | null;
  /** The lock files the current async work holds, so nested calls for one of them do not wait for it. */
  private readonly lockContext = new AsyncLocalStorage<ReadonlySet<string>>();
  /** Per lock file, the tail of this process's queue of turns at it. */
  private readonly lockQueues = new Map<string, Promise<void>>();
  /**
   * Present only when the `lock` option is on, so the token manager treats an
   * unlocked storage exactly as before.
   */
  readonly withLock?: <T>(
    characterId: number,
    fn: () => Promise<T>,
  ) => Promise<T>;
  private cache: Map<number, StoredToken> | null = null;
  private loading: Promise<Map<number, StoredToken>> | null = null;
  /** Bumped by invalidate() so a read that began earlier cannot repopulate the cache. */
  private loadGeneration = 0;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(filePath: string, options: FileTokenStorageOptions = {}) {
    this.filePath = path.resolve(filePath);
    this.mode = options.mode ?? 0o600;
    const lock = options.lock === true ? {} : options.lock || null;
    this.lockOptions = lock
      ? {
          staleMs: lockTiming('staleMs', lock.staleMs, 30_000),
          timeoutMs: lockTiming('timeoutMs', lock.timeoutMs, 60_000),
          retryMs: lockTiming('retryMs', lock.retryMs, 25),
        }
      : null;
    if (this.lockOptions) {
      this.withLock = (characterId, fn) =>
        this.locked(this.characterLockPath(characterId), fn);
    }
  }

  /** Absolute path of the backing file. */
  get path(): string {
    return this.filePath;
  }

  /**
   * Absolute path of the advisory lock file that writes take when `lock` is
   * on. A refresh holds a separate lock file per character,
   * `<path>.<characterId>.lock`.
   */
  get lockPath(): string {
    return `${this.filePath}.lock`;
  }

  async get(characterId: number): Promise<StoredToken | null> {
    const tokens = await this.load();
    const token = tokens.get(characterId);
    return token ? { ...token, scopes: [...token.scopes] } : null;
  }

  async set(characterId: number, token: StoredToken): Promise<void> {
    const copy = { ...token, scopes: [...token.scopes] };
    if (this.lockOptions) {
      // Read, change and write under the lock, so a record another process
      // wrote since this one last read is kept.
      return this.locked(this.lockPath, async () => {
        const tokens = await this.readFile();
        tokens.set(characterId, copy);
        await this.persist(tokens);
      });
    }
    const tokens = await this.load();
    tokens.set(characterId, copy);
    await this.persist(tokens);
  }

  async delete(characterId: number): Promise<void> {
    if (this.lockOptions) {
      return this.locked(this.lockPath, async () => {
        const tokens = await this.readFile();
        if (tokens.delete(characterId)) await this.persist(tokens);
      });
    }
    const tokens = await this.load();
    if (tokens.delete(characterId)) {
      await this.persist(tokens);
    }
  }

  async list(): Promise<StoredToken[]> {
    const tokens = await this.load();
    return Array.from(tokens.values(), (token) => ({
      ...token,
      scopes: [...token.scopes],
    }));
  }

  /** Drop the in-memory copy so the next call re-reads the file. */
  invalidate(): void {
    this.loadGeneration++;
    this.cache = null;
    this.loading = null;
  }

  /**
   * Load once; overlapping first calls share the same read so none of them
   * clobbers another's map. A read that started before invalidate() still
   * resolves for its own callers but neither becomes the cache nor clears a
   * newer in-flight read.
   */
  private load(): Promise<Map<number, StoredToken>> {
    // Another process may have written since the last read.
    if (this.lockOptions) return this.readFile();
    if (this.cache) return Promise.resolve(this.cache);
    if (!this.loading) {
      const generation = this.loadGeneration;
      const pending: Promise<Map<number, StoredToken>> = this.readFile()
        .then((map) => {
          if (this.loadGeneration === generation) this.cache = map;
          return map;
        })
        .finally(() => {
          if (this.loading === pending) this.loading = null;
        });
      this.loading = pending;
    }
    return this.loading;
  }

  private async readFile(): Promise<Map<number, StoredToken>> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return new Map();
      }
      throw err;
    }
    const parsed = JSON.parse(raw) as Partial<TokenFile>;
    const map = new Map<number, StoredToken>();
    const entries: Record<string, unknown> = parsed.tokens ?? {};
    for (const token of Object.values(entries)) {
      if (isStoredToken(token)) {
        map.set(token.characterId, token);
      }
    }
    return map;
  }

  private persist(tokens: Map<number, StoredToken>): Promise<void> {
    const snapshot: TokenFile = {
      version: FILE_FORMAT_VERSION,
      tokens: {},
    };
    for (const [id, token] of tokens) {
      snapshot.tokens[String(id)] = token;
    }
    const run = async (): Promise<void> => {
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(snapshot, null, 2), {
        encoding: 'utf8',
        mode: this.mode,
      });
      await fs.rename(tmp, this.filePath);
    };
    this.writeChain = this.writeChain.then(run, run);
    return this.writeChain;
  }

  /** The lock file a refresh of one character holds. */
  private characterLockPath(characterId: number): string {
    return `${this.filePath}.${characterId}.lock`;
  }

  /**
   * Run `fn` holding `lockFile`. Work already holding that lock file runs
   * straight away; other callers in this process queue for it, so only one
   * of them is at the lock file at a time. `timeoutMs` covers the time spent
   * in that queue as well as the time spent at the lock file.
   */
  private locked<T>(lockFile: string, fn: () => Promise<T>): Promise<T> {
    const held = this.lockContext.getStore();
    if (held?.has(lockFile)) return fn();
    const deadline = systemClock.now() + this.lockOptions!.timeoutMs;
    const previous = this.lockQueues.get(lockFile) ?? Promise.resolve();
    const turn = previous.then(async () => {
      const nonce = await this.acquireLockFile(lockFile, deadline);
      try {
        const holding = new Set(held);
        holding.add(lockFile);
        return await this.lockContext.run(holding, fn);
      } finally {
        await this.releaseLockFile(lockFile, nonce);
      }
    });
    const tail = turn.then(
      () => undefined,
      () => undefined,
    );
    this.lockQueues.set(lockFile, tail);
    void tail.then(() => {
      if (this.lockQueues.get(lockFile) === tail) {
        this.lockQueues.delete(lockFile);
      }
    });
    return turn;
  }

  private timeoutError(file: string): Error {
    return new Error(
      `Timed out after ${this.lockOptions!.timeoutMs} ms waiting for token file lock ${file}`,
    );
  }

  /**
   * Create `file` holding `body`, failing if it exists. The body is written
   * to a private file first and then hard-linked into place, so the link is
   * atomic and whoever finds the file always reads a complete body.
   */
  private async createExclusive(file: string, body: string): Promise<boolean> {
    const tmp = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, body, { mode: this.mode });
    try {
      await fs.link(tmp, file);
      return true;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') return false;
      throw err;
    } finally {
      await fs.unlink(tmp).catch(() => undefined);
    }
  }

  private lockBody(nonce: string): string {
    const body: LockFileBody = {
      pid: process.pid,
      nonce,
      acquiredAt: systemClock.now(),
    };
    return JSON.stringify(body);
  }

  /** Take `lockFile`, breaking it first when its holder has gone stale. */
  private async acquireLockFile(
    lockFile: string,
    deadline: number,
  ): Promise<string> {
    const nonce = randomUUID();
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    for (;;) {
      if (systemClock.now() >= deadline) throw this.timeoutError(lockFile);
      if (await this.createExclusive(lockFile, this.lockBody(nonce))) {
        return nonce;
      }
      if (await this.breakStaleLock(lockFile, deadline)) continue;
      await systemClock.sleep(this.lockOptions!.retryMs);
    }
  }

  /**
   * Run `fn` holding `<lockFile>.break`, the guard every removal of
   * `lockFile` takes: breaking a stale lock and releasing one. Creating the
   * lock needs no guard, because a link into an occupied path fails. With
   * removals one at a time, a remover that has just read the lock file
   * knows the same file is still there when it deletes it. The guard is
   * held for two file operations; one older than `staleMs` was left by a
   * crash and is removed.
   */
  private async withGuard<T>(
    lockFile: string,
    deadline: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const guard = `${lockFile}.break`;
    const nonce = randomUUID();
    for (;;) {
      if (await this.createExclusive(guard, this.lockBody(nonce))) break;
      const holder = await this.readLockFile(guard);
      if (holder !== undefined && this.isStale(holder.body)) {
        await fs.unlink(guard).catch(() => undefined);
        continue;
      }
      if (systemClock.now() >= deadline) throw this.timeoutError(guard);
      await systemClock.sleep(this.lockOptions!.retryMs);
    }
    try {
      return await fn();
    } finally {
      await fs.unlink(guard).catch(() => undefined);
    }
  }

  private isStale(body: LockFileBody | null): boolean {
    return (
      body === null ||
      systemClock.now() - body.acquiredAt >= this.lockOptions!.staleMs
    );
  }

  /**
   * Remove `lockFile` when its holder is older than `staleMs`, but only if it
   * is still the file judged stale: under the guard the file is read again
   * and compared byte for byte. Returns true when the lock is gone and worth
   * retrying at once.
   */
  private async breakStaleLock(
    lockFile: string,
    deadline: number,
  ): Promise<boolean> {
    const seen = await this.readLockFile(lockFile);
    if (seen === undefined) return true;
    if (!this.isStale(seen.body)) return false;
    return this.withGuard(lockFile, deadline, async () => {
      const current = await this.readLockFile(lockFile);
      if (current === undefined) return true;
      if (current.raw !== seen.raw) return false;
      await fs.unlink(lockFile).catch(() => undefined);
      return true;
    });
  }

  /**
   * Delete `lockFile` if it is still this holder's; a holder that overran
   * `staleMs` may have lost it. A release that cannot get the guard leaves
   * the lock to go stale rather than fail the work it protected.
   */
  private async releaseLockFile(
    lockFile: string,
    nonce: string,
  ): Promise<void> {
    const deadline = systemClock.now() + this.lockOptions!.timeoutMs;
    await this.withGuard(lockFile, deadline, async () => {
      const current = await this.readLockFile(lockFile);
      if (current?.body?.nonce === nonce) {
        await fs.unlink(lockFile).catch(() => undefined);
      }
    }).catch(() => undefined);
  }

  /**
   * A lock file's raw text and its body, or null for a body that is not a
   * lock; undefined when the file is absent.
   */
  private async readLockFile(
    file: string,
  ): Promise<{ raw: string; body: LockFileBody | null } | undefined> {
    let raw: string;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw err;
    }
    return { raw, body: parseLockBody(raw) };
  }
}

function parseLockBody(raw: string): LockFileBody | null {
  try {
    const body = JSON.parse(raw) as Partial<LockFileBody> | null;
    return typeof body?.nonce === 'string' &&
      typeof body.acquiredAt === 'number'
      ? (body as LockFileBody)
      : null;
  } catch {
    return null;
  }
}
