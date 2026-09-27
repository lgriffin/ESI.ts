import type { Identity } from '../core/ports/Identity';
import type { TokenProvider } from '../core/ports/TokenProvider';
import { characterIdOfToken } from '../core/util/callerIdentity';

/**
 * An identity over one access token. It cannot refresh: when ESI rejects the
 * token, the call fails with the 401 after a single request. Suited to a
 * short-lived script or a token another system keeps fresh and hands in.
 */
export function identityFromToken(accessToken: string): Identity {
  const characterId = characterIdOfToken(accessToken) ?? undefined;
  return Object.freeze({
    characterId,
    accessToken: () => Promise.resolve(accessToken),
  });
}

export interface ProviderIdentityOptions {
  /** The character the provider's tokens belong to, for diagnostics. */
  readonly characterId?: number;
}

/**
 * An identity over a `TokenProvider`: the same function supplies the token
 * before each request and the replacement after a 401, as the provider
 * contract says it returns the current token, refreshing first when it knows
 * the old one has expired.
 */
export function identityFromProvider(
  provider: TokenProvider,
  options: ProviderIdentityOptions = {},
): Identity {
  return Object.freeze({
    characterId: options.characterId,
    accessToken: () => provider(),
    refreshAccessToken: () => provider(),
  });
}
