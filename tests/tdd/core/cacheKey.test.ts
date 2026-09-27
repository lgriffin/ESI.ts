import { createHash } from 'crypto';
import { buildCacheKey } from '../../../src/core/cache/cacheKey';
import { ApiClient } from '../../../src/core/ApiClient';
import {
  buildConditionalCacheKey,
  buildDedupeKey,
  markTokenAccepted,
} from '../../../src/core/cache/cacheKey';

/** A client whose current token ESI has answered, so its claimed character is trusted. */
function accepted(client: ApiClient): ApiClient {
  markTokenAccepted(client, client.getAuthorizationHeader() as string);
  return client;
}

/** An unsigned JWT naming a character, as EVE SSO issues; `jti` makes each one distinct. */
function ssoToken(characterId: number, jti = 'a'): string {
  const b64 = (v: string) => Buffer.from(v).toString('base64url');
  return [
    b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    b64(JSON.stringify({ sub: `CHARACTER:EVE:${characterId}`, jti })),
    b64('signature'),
  ].join('.');
}

const BASE = 'https://esi.evetech.net';

describe('buildCacheKey', () => {
  const url = 'https://esi.evetech.net/v1/characters/12345/assets/';

  it('should return the raw URL when client has no access token', () => {
    const client = new ApiClient('test', 'https://esi.evetech.net');
    expect(buildCacheKey(url, client, true)).toBe(url);
  });

  it('should return the raw URL for public endpoints even with a token', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-abc',
    );
    expect(buildCacheKey(url, client, false)).toBe(url);
  });

  it('should return the raw URL when requiresAuth is omitted', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-abc',
    );
    expect(buildCacheKey(url, client)).toBe(url);
  });

  it('should prefix a token hash for authenticated endpoints', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-abc',
    );
    const key = buildCacheKey(url, client, true);
    expect(key).not.toBe(url);
    expect(key).toContain(url);
    expect(key).toMatch(/^[0-9a-f]{16}:/);
  });

  it('should produce different keys for different tokens on the same URL', () => {
    const clientA = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-user-a',
    );
    const clientB = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-user-b',
    );
    const keyA = buildCacheKey(url, clientA, true);
    const keyB = buildCacheKey(url, clientB, true);
    expect(keyA).not.toBe(keyB);
  });

  it('should produce the same key for the same token and URL', () => {
    const client1 = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'same-token',
    );
    const client2 = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'same-token',
    );
    expect(buildCacheKey(url, client1, true)).toBe(
      buildCacheKey(url, client2, true),
    );
  });

  it('should produce different keys for different URLs with the same token', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-abc',
    );
    const url2 = 'https://esi.evetech.net/v1/characters/67890/assets/';
    expect(buildCacheKey(url, client, true)).not.toBe(
      buildCacheKey(url2, client, true),
    );
  });

  it('should use a SHA-256 hash of the authorization header', () => {
    const token = 'my-token';
    const client = new ApiClient('test', 'https://esi.evetech.net', token);
    const expectedHash = createHash('sha256')
      .update(`Bearer ${token}`)
      .digest('hex')
      .slice(0, 16);
    const key = buildCacheKey(url, client, true);
    expect(key).toBe(`${expectedHash}:${url}`);
  });

  it('should reflect token changes via setAccessToken', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'original-token',
    );
    const keyBefore = buildCacheKey(url, client, true);
    client.setAccessToken('new-token');
    const keyAfter = buildCacheKey(url, client, true);
    expect(keyBefore).not.toBe(keyAfter);
  });

  it('should let public endpoints share cache across token-bearing clients', () => {
    const clientA = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-user-a',
    );
    const clientB = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-user-b',
    );
    const publicUrl = 'https://esi.evetech.net/v1/status/';
    expect(buildCacheKey(publicUrl, clientA, false)).toBe(
      buildCacheKey(publicUrl, clientB, false),
    );
  });

  describe('with EVE SSO tokens', () => {
    it('keys an accepted token by the character it names', () => {
      const client = accepted(new ApiClient('test', BASE, ssoToken(95465499)));
      expect(buildCacheKey(url, client, true)).toBe(
        `character:95465499:${url}`,
      );
    });

    it('keys a token ESI has not accepted by its hash, whatever it claims', () => {
      const client = new ApiClient('test', BASE, ssoToken(95465499));
      const key = buildCacheKey(url, client, true);
      expect(key).toMatch(/^[0-9a-f]{16}:/);
      expect(key).not.toContain('character:');
    });

    it("sends the claimed character's ETag before ESI has accepted the token", () => {
      const client = new ApiClient('test', BASE, ssoToken(95465499));
      expect(buildConditionalCacheKey(url, client, true)).toBe(
        `character:95465499:${url}`,
      );
    });

    it('keeps the key when an accepted token is replaced by another accepted one for the same character', () => {
      const client = accepted(
        new ApiClient('test', BASE, ssoToken(95465499, 'first')),
      );
      const before = buildCacheKey(url, client, true);
      client.setAccessToken(ssoToken(95465499, 'second'));
      expect(buildCacheKey(url, client, true)).not.toBe(before);
      accepted(client);
      expect(buildCacheKey(url, client, true)).toBe(before);
    });

    it('records acceptance for the header the request carried, not the current one', () => {
      const client = new ApiClient('test', BASE, ssoToken(95465499, 'first'));
      const sent = client.getAuthorizationHeader() as string;
      client.setAccessToken(ssoToken(95465499, 'second'));
      markTokenAccepted(client, sent);
      expect(buildCacheKey(url, client, true)).toMatch(/^[0-9a-f]{16}:/);
      client.setAccessToken(ssoToken(95465499, 'first'));
      expect(buildCacheKey(url, client, true)).toBe(
        `character:95465499:${url}`,
      );
    });

    it('changes the key when the token is replaced by one for another character', () => {
      const client = accepted(new ApiClient('test', BASE, ssoToken(1)));
      const before = buildCacheKey(url, client, true);
      client.setAccessToken(ssoToken(2));
      accepted(client);
      expect(buildCacheKey(url, client, true)).not.toBe(before);
    });

    it('gives two clients holding accepted tokens for one character the same key', () => {
      const a = accepted(new ApiClient('test', BASE, ssoToken(95465499, 'a')));
      const b = accepted(new ApiClient('test', BASE, ssoToken(95465499, 'b')));
      expect(buildCacheKey(url, a, true)).toBe(buildCacheKey(url, b, true));
    });

    it('does not carry acceptance from one client to another', () => {
      const a = accepted(new ApiClient('test', BASE, ssoToken(95465499, 'a')));
      const b = new ApiClient('test', BASE, ssoToken(95465499, 'a'));
      expect(buildCacheKey(url, b, true)).not.toBe(buildCacheKey(url, a, true));
    });

    it('changes the key when an SSO token is replaced by an opaque one', () => {
      const client = accepted(new ApiClient('test', BASE, ssoToken(95465499)));
      const before = buildCacheKey(url, client, true);
      client.setAccessToken('opaque');
      accepted(client);
      expect(buildCacheKey(url, client, true)).toMatch(/^[0-9a-f]{16}:/);
      expect(buildCacheKey(url, client, true)).not.toBe(before);
    });

    it('does not let a public endpoint key carry the character', () => {
      const client = accepted(new ApiClient('test', BASE, ssoToken(95465499)));
      expect(buildCacheKey(url, client, false)).toBe(url);
      expect(buildConditionalCacheKey(url, client, false)).toBe(url);
    });

    it('marks acceptance once and forgets the oldest token past the limit', () => {
      const client = new ApiClient('test', BASE, ssoToken(1, 'oldest'));
      const oldest = client.getAuthorizationHeader() as string;
      markTokenAccepted(client, oldest);
      markTokenAccepted(client, oldest);
      for (let i = 0; i < 64; i++) {
        markTokenAccepted(client, `Bearer filler-${i}`);
      }
      expect(buildCacheKey(url, client, true)).toMatch(/^[0-9a-f]{16}:/);
      client.setAccessToken('filler-63');
      expect(buildCacheKey(url, client, true)).toMatch(/^[0-9a-f]{16}:/);
    });
  });

  describe('buildDedupeKey', () => {
    const endpoint = 'characters/95465499/online';

    it('draws the same identity line as the cache key', () => {
      const client = new ApiClient('test', BASE, ssoToken(95465499));
      expect(buildDedupeKey(endpoint, client, true)).toBe(
        buildCacheKey(endpoint, client, true),
      );
      accepted(client);
      expect(buildDedupeKey(endpoint, client, true)).toBe(
        `character:95465499:${endpoint}`,
      );
      client.setAccessToken('opaque');
      expect(buildDedupeKey(endpoint, client, true)).toBe(
        buildCacheKey(endpoint, client, true),
      );
    });

    it('returns the bare endpoint for public requests and for a client with no token', () => {
      expect(
        buildDedupeKey(endpoint, new ApiClient('test', BASE, 'opaque'), false),
      ).toBe(endpoint);
      expect(buildDedupeKey(endpoint, new ApiClient('test', BASE), true)).toBe(
        endpoint,
      );
    });
  });
});
