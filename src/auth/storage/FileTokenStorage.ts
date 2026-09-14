import { promises as fs } from 'fs';
import * as path from 'path';
import type { ITokenStorage, StoredToken } from '../types';

const FILE_FORMAT_VERSION = 1;

interface TokenFile {
  version: number;
  tokens: Record<string, StoredToken>;
}

export interface FileTokenStorageOptions {
  /**
   * POSIX permission bits for the token file. Defaults to `0o600` (owner
   * read/write only). Ignored on platforms without POSIX modes.
   */
  mode?: number;
}

/**
 * JSON-file {@link ITokenStorage} for single-process applications.
 *
 * Writes go to a sibling temporary file that is renamed over the target, so a
 * crash mid-write leaves the previous file intact. Writes are serialised
 * within the process. Two processes sharing one file are not supported: each
 * would rotate refresh tokens the other cannot see.
 */
export class FileTokenStorage implements ITokenStorage {
  private readonly filePath: string;
  private readonly mode: number;
  private cache: Map<number, StoredToken> | null = null;
  private loading: Promise<Map<number, StoredToken>> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(filePath: string, options: FileTokenStorageOptions = {}) {
    this.filePath = path.resolve(filePath);
    this.mode = options.mode ?? 0o600;
  }

  /** Absolute path of the backing file. */
  get path(): string {
    return this.filePath;
  }

  async get(characterId: number): Promise<StoredToken | null> {
    const tokens = await this.load();
    const token = tokens.get(characterId);
    return token ? { ...token, scopes: [...token.scopes] } : null;
  }

  async set(characterId: number, token: StoredToken): Promise<void> {
    const tokens = await this.load();
    tokens.set(characterId, { ...token, scopes: [...token.scopes] });
    await this.persist();
  }

  async delete(characterId: number): Promise<void> {
    const tokens = await this.load();
    if (tokens.delete(characterId)) {
      await this.persist();
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
    this.cache = null;
    this.loading = null;
  }

  /** Load once; overlapping first calls share the same read so none of them clobbers another's map. */
  private load(): Promise<Map<number, StoredToken>> {
    if (this.cache) return Promise.resolve(this.cache);
    if (!this.loading) {
      this.loading = this.readFile().finally(() => {
        this.loading = null;
      });
    }
    return this.loading;
  }

  private async readFile(): Promise<Map<number, StoredToken>> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        this.cache = new Map();
        return this.cache;
      }
      throw err;
    }
    const parsed = JSON.parse(raw) as Partial<TokenFile>;
    const map = new Map<number, StoredToken>();
    const entries = parsed.tokens ?? {};
    for (const token of Object.values(entries)) {
      if (token && typeof token.characterId === 'number') {
        map.set(token.characterId, token);
      }
    }
    this.cache = map;
    return map;
  }

  private persist(): Promise<void> {
    const snapshot: TokenFile = {
      version: FILE_FORMAT_VERSION,
      tokens: {},
    };
    for (const [id, token] of this.cache ?? []) {
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
}
