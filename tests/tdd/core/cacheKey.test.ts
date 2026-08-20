import { createHash } from 'crypto';
import { buildCacheKey } from '../../../src/core/cache/cacheKey';
import { ApiClient } from '../../../src/core/ApiClient';

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
});
