import { createHash, randomBytes } from 'crypto';

/**
 * A PKCE verifier/challenge pair for the authorization-code flow of a public
 * client (one that cannot hold a client secret).
 */
export interface PkcePair {
  /** Random secret sent with the token request as `code_verifier`. */
  codeVerifier: string;
  /** `BASE64URL(SHA256(codeVerifier))`, sent in the authorization URL. */
  codeChallenge: string;
  /** Always `S256`; EVE SSO does not accept the plain method. */
  codeChallengeMethod: 'S256';
}

/** Generate a 32-byte base64url code verifier (43 characters). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString('base64url');
}

/** Derive the S256 code challenge for a verifier. */
export function codeChallengeFromVerifier(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url');
}

/** Generate a verifier and its challenge in one call. */
export function generatePkcePair(): PkcePair {
  const codeVerifier = generateCodeVerifier();
  return {
    codeVerifier,
    codeChallenge: codeChallengeFromVerifier(codeVerifier),
    codeChallengeMethod: 'S256',
  };
}

/** Generate an unguessable OAuth2 `state` value. */
export function generateState(): string {
  return randomBytes(16).toString('base64url');
}
