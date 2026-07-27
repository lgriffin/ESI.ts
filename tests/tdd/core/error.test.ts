import {
  sanitizeUrl,
  EsiError,
  EsiValidationError,
} from '../../../src/core/util/error';

describe('sanitizeUrl', () => {
  it('should redact token param', () => {
    expect(sanitizeUrl('https://api.example.com/path?token=secret123')).toBe(
      'https://api.example.com/path?token=%5BREDACTED%5D',
    );
  });

  it('should redact access_token param', () => {
    expect(sanitizeUrl('https://api.example.com/path?access_token=abc')).toBe(
      'https://api.example.com/path?access_token=%5BREDACTED%5D',
    );
  });

  it('should redact refresh_token param', () => {
    expect(sanitizeUrl('https://api.example.com/path?refresh_token=xyz')).toBe(
      'https://api.example.com/path?refresh_token=%5BREDACTED%5D',
    );
  });

  it('should redact client_secret param', () => {
    expect(
      sanitizeUrl('https://api.example.com/path?client_secret=s3cr3t'),
    ).toBe('https://api.example.com/path?client_secret=%5BREDACTED%5D');
  });

  it('should redact api_key param', () => {
    expect(sanitizeUrl('https://api.example.com/path?api_key=key123')).toBe(
      'https://api.example.com/path?api_key=%5BREDACTED%5D',
    );
  });

  it('should redact code param', () => {
    expect(sanitizeUrl('https://api.example.com/callback?code=authcode')).toBe(
      'https://api.example.com/callback?code=%5BREDACTED%5D',
    );
  });

  it('should redact password param', () => {
    expect(sanitizeUrl('https://api.example.com/login?password=hunter2')).toBe(
      'https://api.example.com/login?password=%5BREDACTED%5D',
    );
  });

  it('should redact multiple sensitive params at once', () => {
    const result = sanitizeUrl(
      'https://api.example.com/path?token=a&key=b&safe=ok',
    );
    expect(result).toContain('token=%5BREDACTED%5D');
    expect(result).toContain('key=%5BREDACTED%5D');
    expect(result).toContain('safe=ok');
  });

  it('should preserve non-sensitive params', () => {
    expect(sanitizeUrl('https://api.example.com/path?page=1&limit=50')).toBe(
      'https://api.example.com/path?page=1&limit=50',
    );
  });

  it('should return undefined for undefined input', () => {
    expect(sanitizeUrl(undefined)).toBeUndefined();
  });

  it('should return empty string for empty input', () => {
    expect(sanitizeUrl('')).toBe('');
  });

  it('should handle URLs with no query params', () => {
    expect(sanitizeUrl('https://api.example.com/path')).toBe(
      'https://api.example.com/path',
    );
  });

  it('should redact params in malformed URLs by stripping query string', () => {
    const result = sanitizeUrl('not-a-url?token=secret');
    expect(result).toBe('not-a-url?[params-redacted]');
    expect(result).not.toContain('secret');
  });
});

describe('EsiError', () => {
  it('should sanitize URL in stored url property', () => {
    const error = new EsiError(
      400,
      'Bad request',
      'https://esi.evetech.net/path?token=secret',
    );
    expect(error.url).not.toContain('secret');
    expect(error.url).toContain('REDACTED');
  });
});

describe('EsiValidationError', () => {
  it('should sanitize URL in error message', () => {
    const error = new EsiValidationError(
      'https://esi.evetech.net/path?token=secret',
      { message: 'validation failed' },
    );
    expect(error.message).not.toContain('secret');
    expect(error.message).toContain('REDACTED');
  });

  it('should sanitize URL in stored url property', () => {
    const error = new EsiValidationError(
      'https://esi.evetech.net/path?access_token=mytoken',
      { message: 'bad' },
    );
    expect(error.url).not.toContain('mytoken');
  });
});
