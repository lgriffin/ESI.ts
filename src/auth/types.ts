/**
 * A character's SSO credentials as held by an {@link ITokenStorage}.
 *
 * Timestamps are epoch milliseconds so the record is JSON-safe and can be
 * compared against `Date.now()` without parsing.
 */
export interface StoredToken {
  /** EVE character id, decoded from the access token's `sub` claim. */
  characterId: number;
  /** Character name, decoded from the access token's `name` claim. */
  characterName: string;
  /** Current bearer token for ESI requests. */
  accessToken: string;
  /** Refresh token as of the last SSO exchange; SSO rotates it on every use. */
  refreshToken: string;
  /** When `accessToken` expires, in epoch milliseconds. */
  expiresAt: number;
  /** Scopes granted to this token, decoded from the `scp` claim. */
  scopes: string[];
  /** The `owner` claim: changes if the character is transferred between accounts. */
  ownerHash?: string;
  /** When this record was last written, in epoch milliseconds. */
  updatedAt: number;
  /**
   * Set when SSO rejected the refresh token as invalid. The manager stops
   * contacting SSO for this character until it is added again.
   */
  revokedAt?: number;
}

/**
 * Persistence contract for {@link StoredToken} records, keyed by character id.
 *
 * Implementations must return copies rather than shared references and must
 * tolerate `get`/`delete` for ids they have never seen.
 */
export interface ITokenStorage {
  get(characterId: number): Promise<StoredToken | null>;
  set(characterId: number, token: StoredToken): Promise<void>;
  delete(characterId: number): Promise<void>;
  list(): Promise<StoredToken[]>;
}
