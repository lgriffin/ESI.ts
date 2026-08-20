import { createHash } from 'crypto';
import { buildCacheKey } from '../../../src/core/cache/cacheKey';
import { ApiClient } from '../../../src/core/ApiClient';

describe('buildCacheKey', () => {
  const url = 'https://esi.evetech.net/v1/characters/12345/assets/';

  it('should return the raw URL when client has no access token', () => {
    const client = new ApiClient('test', 'https://esi.evetech.net');
    expect(buildCacheKey(url, client)).toBe(url);
  });

  it('should prefix a token hash when client has an access token', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-abc',
    );
    const key = buildCacheKey(url, client);
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
    const keyA = buildCacheKey(url, clientA);
    const keyB = buildCacheKey(url, clientB);
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
    expect(buildCacheKey(url, client1)).toBe(buildCacheKey(url, client2));
  });

  it('should produce different keys for different URLs with the same token', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'token-abc',
    );
    const url2 = 'https://esi.evetech.net/v1/characters/67890/assets/';
    expect(buildCacheKey(url, client)).not.toBe(buildCacheKey(url2, client));
  });

  it('should use a SHA-256 hash of the authorization header', () => {
    const token = 'my-token';
    const client = new ApiClient('test', 'https://esi.evetech.net', token);
    const expectedHash = createHash('sha256')
      .update(`Bearer ${token}`)
      .digest('hex')
      .slice(0, 16);
    const key = buildCacheKey(url, client);
    expect(key).toBe(`${expectedHash}:${url}`);
  });

  it('should reflect token changes via setAccessToken', () => {
    const client = new ApiClient(
      'test',
      'https://esi.evetech.net',
      'original-token',
    );
    const keyBefore = buildCacheKey(url, client);
    client.setAccessToken('new-token');
    const keyAfter = buildCacheKey(url, client);
    expect(keyBefore).not.toBe(keyAfter);
  });
});
