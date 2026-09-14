import type { ITokenStorage, StoredToken } from '../types';

/**
 * In-memory {@link ITokenStorage}. Tokens live only as long as the process.
 * Useful for tests, CLIs that log in on every run, and as a cache in front of
 * a durable store.
 */
export class MemoryTokenStorage implements ITokenStorage {
  private readonly tokens = new Map<number, StoredToken>();

  constructor(initial: readonly StoredToken[] = []) {
    for (const token of initial) {
      this.tokens.set(token.characterId, {
        ...token,
        scopes: [...token.scopes],
      });
    }
  }

  get(characterId: number): Promise<StoredToken | null> {
    const token = this.tokens.get(characterId);
    return Promise.resolve(
      token ? { ...token, scopes: [...token.scopes] } : null,
    );
  }

  set(characterId: number, token: StoredToken): Promise<void> {
    this.tokens.set(characterId, { ...token, scopes: [...token.scopes] });
    return Promise.resolve();
  }

  delete(characterId: number): Promise<void> {
    this.tokens.delete(characterId);
    return Promise.resolve();
  }

  list(): Promise<StoredToken[]> {
    return Promise.resolve(
      Array.from(this.tokens.values(), (token) => ({
        ...token,
        scopes: [...token.scopes],
      })),
    );
  }

  /** Remove every token. */
  clear(): void {
    this.tokens.clear();
  }

  get size(): number {
    return this.tokens.size;
  }
}
