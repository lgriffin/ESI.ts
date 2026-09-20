import { createHash } from 'crypto';
import {
  codeChallengeFromVerifier,
  generateCodeVerifier,
  generatePkcePair,
  generateState,
} from '../../../src/auth/pkce';

const BASE64URL = /^[A-Za-z0-9_-]+$/;

describe('pkce', () => {
  it('generates a 43-character base64url verifier', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(43);
    expect(verifier).toMatch(BASE64URL);
  });

  it('generates a different verifier each time', () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });

  it('derives the S256 challenge as base64url(sha256(verifier))', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expected = createHash('sha256').update(verifier).digest('base64url');
    expect(codeChallengeFromVerifier(verifier)).toBe(expected);
    expect(codeChallengeFromVerifier(verifier)).toMatch(BASE64URL);
  });

  it('returns a matching pair with the S256 method', () => {
    const pair = generatePkcePair();
    expect(pair.codeChallengeMethod).toBe('S256');
    expect(pair.codeChallenge).toBe(
      codeChallengeFromVerifier(pair.codeVerifier),
    );
  });

  it('generates an unguessable state value', () => {
    const state = generateState();
    expect(state.length).toBeGreaterThanOrEqual(20);
    expect(state).toMatch(BASE64URL);
    expect(generateState()).not.toBe(state);
  });
});
