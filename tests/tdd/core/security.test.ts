import { EsiClient } from '../../../src/EsiClient';
import {
  validatePathParam,
  validateBaseUrl,
  validateQueryParam,
} from '../../../src/core/util/validation';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

const BASE_URL = 'https://esi.test.local';

const standardHeaders = (overrides: Record<string, string> = {}) => ({
  'x-pages': '1',
  'x-ratelimit-remaining': '95',
  'x-ratelimit-limit': '100',
  'x-ratelimit-used': '5',
  'x-ratelimit-group': 'market',
  ...overrides,
});

function resetGlobals() {
  fetchMock.resetMocks();
}

describe('Security: Token Handling', () => {
  afterEach(() => {
    resetGlobals();
  });

  it('should NOT send Authorization header to public endpoints', async () => {
    const client = new EsiClient({
      clientId: 'security-public',
      baseUrl: BASE_URL,
      unsafeAllowCustomHost: true,
      accessToken: 'secret-token-should-not-leak',
      enableETagCache: false,
    });

    fetchMock.mockResponseOnce(
      JSON.stringify({
        players: 100,
        server_version: '1',
        start_time: '2024-01-01T00:00:00Z',
      }),
      { headers: standardHeaders() },
    );

    await client.status.getStatus();

    const sentHeaders = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(sentHeaders['Authorization']).toBeUndefined();

    client.shutdown();
  });

  it('should send Authorization header to authenticated endpoints', async () => {
    const client = new EsiClient({
      clientId: 'security-auth',
      baseUrl: BASE_URL,
      unsafeAllowCustomHost: true,
      accessToken: 'my-auth-token',
      enableETagCache: false,
    });

    fetchMock.mockResponseOnce(JSON.stringify([]), {
      headers: standardHeaders(),
    });

    await client.market.getCharacterOrders(12345);

    const sentHeaders = fetchMock.mock.calls[0][1]?.headers as Record<
      string,
      string
    >;
    expect(sentHeaders['Authorization']).toBe('Bearer my-auth-token');

    client.shutdown();
  });
});

describe('Security: HTTPS Enforcement', () => {
  it('should reject http:// base URL', () => {
    expect(() => {
      new EsiClient({
        clientId: 'security-http',
        baseUrl: 'http://esi.evetech.net',
      });
    }).toThrow(/HTTPS/);
  });

  it('should reject http:// via validateBaseUrl directly', () => {
    expect(() => validateBaseUrl('http://esi.evetech.net')).toThrow(/HTTPS/);
  });
});

describe('Security: Host Allowlist', () => {
  it('should reject unknown hosts without unsafeAllowCustomHost', () => {
    expect(() => {
      new EsiClient({
        clientId: 'security-host',
        baseUrl: 'https://evil.example.com',
      });
    }).toThrow(/not in the allowlist/);
  });

  it('should reject unknown hosts via validateBaseUrl directly', () => {
    expect(() => validateBaseUrl('https://evil.example.com')).toThrow(
      /not in the allowlist/,
    );
  });

  it('should allow custom hosts with unsafeAllowCustomHost', () => {
    const client = new EsiClient({
      clientId: 'security-custom-host',
      baseUrl: 'https://custom.host.com',
      unsafeAllowCustomHost: true,
      enableETagCache: false,
    });

    // Should not throw
    expect(client).toBeDefined();
    client.shutdown();
  });

  it('should allow custom hosts via validateBaseUrl with allowCustomHost flag', () => {
    const result = validateBaseUrl('https://custom.host.com', true);
    expect(result).toBe('https://custom.host.com');
  });
});

describe('Security: Path Parameter Injection', () => {
  it('should reject path traversal (../)', () => {
    expect(() => validatePathParam('id', '../etc/passwd')).toThrow(
      /invalid characters/,
    );
  });

  it('should reject query string injection (?)', () => {
    expect(() => validatePathParam('id', 'value?admin=true')).toThrow(
      /invalid characters/,
    );
  });

  it('should reject fragment injection (#)', () => {
    expect(() => validatePathParam('id', 'value#fragment')).toThrow(
      /invalid characters/,
    );
  });

  it('should reject backslash (\\)', () => {
    expect(() => validatePathParam('id', 'value\\path')).toThrow(
      /invalid characters/,
    );
  });

  it('should reject forward slash (/)', () => {
    expect(() => validatePathParam('id', 'value/path')).toThrow(
      /invalid characters/,
    );
  });

  it('should reject at sign (@)', () => {
    expect(() => validatePathParam('id', 'user@host')).toThrow(
      /invalid characters/,
    );
  });

  it('should accept valid path parameters', () => {
    expect(validatePathParam('id', '12345')).toBe('12345');
    expect(validatePathParam('name', 'valid-name')).toBe('valid-name');
    expect(validatePathParam('name', 'valid_name')).toBe('valid_name');
    expect(validatePathParam('name', 'valid.name')).toBe('valid.name');
  });
});

describe('Security: Query Parameter Length Limit', () => {
  it('should reject query parameters exceeding 2000 characters', () => {
    const longValue = 'a'.repeat(2001);
    expect(() => validateQueryParam('search', longValue)).toThrow(
      /exceeds maximum length/,
    );
  });

  it('should accept query parameters within 2000 characters', () => {
    const validValue = 'a'.repeat(2000);
    expect(validateQueryParam('search', validValue)).toBe(validValue);
  });
});

describe('Security: NaN/Infinity Path Params', () => {
  it('should reject NaN', () => {
    expect(() => validatePathParam('id', NaN)).toThrow(/finite number/);
  });

  it('should reject Infinity', () => {
    expect(() => validatePathParam('id', Infinity)).toThrow(/finite number/);
  });

  it('should reject negative Infinity', () => {
    expect(() => validatePathParam('id', -Infinity)).toThrow(/finite number/);
  });
});

describe('Security: Null/Empty Path Params', () => {
  it('should reject null', () => {
    expect(() => validatePathParam('id', null)).toThrow(/must not be empty/);
  });

  it('should reject undefined', () => {
    expect(() => validatePathParam('id', undefined)).toThrow(
      /must not be empty/,
    );
  });

  it('should reject empty string', () => {
    expect(() => validatePathParam('id', '')).toThrow(/must not be empty/);
  });
});
