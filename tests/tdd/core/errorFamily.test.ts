import {
  CircuitOpenError,
  EsiConfigurationError,
  EsiError,
  EsiFaultError,
  EsiNetworkError,
  EsiPaginationError,
  EsiParseError,
  EsiTokenRefreshError,
  EsiValidationError,
  TimeoutError,
  isCircuitOpen,
  isConfigurationError,
  isEsiError,
  isFaultError,
  isNetworkError,
  isPaginationError,
  isParseError,
  isRetryable,
  isTimeout,
  isTokenRefreshError,
  toEsiError,
} from '../../../src/core/util/error';

describe('error family (ARCH-07)', () => {
  it('EsiValidationError is neither retryable nor a timeout', () => {
    const err = new EsiValidationError('https://esi.evetech.net/x', {});
    expect(err.retryable).toBe(false);
    expect(isRetryable(err)).toBe(false);
    expect(err.isTimeout()).toBe(false);
  });

  it('EsiNetworkError is a retryable EsiError that is not a timeout', () => {
    const cause = new TypeError('fetch failed');
    const err = new EsiNetworkError(
      'fetch failed',
      'https://esi.evetech.net/x',
      cause,
    );
    expect(err).toBeInstanceOf(EsiError);
    expect(isNetworkError(err)).toBe(true);
    expect(err.statusCode).toBe(0);
    expect(err.retryable).toBe(true);
    expect(err.isTimeout()).toBe(false);
    expect(isTimeout(err)).toBe(false);
    expect(err.cause).toBe(cause);
    expect(err.message).toBe('Network request failed: fetch failed');
    expect(err.name).toBe('EsiNetworkError');
  });

  it('TimeoutError still reports isTimeout()', () => {
    expect(new TimeoutError(10).isTimeout()).toBe(true);
  });

  it('CircuitOpenError is an EsiError, not retryable, keeping its fields', () => {
    const err = new CircuitOpenError('/markets/', 5, 2500);
    expect(isEsiError(err)).toBe(true);
    expect(isCircuitOpen(err)).toBe(true);
    expect(err.retryable).toBe(false);
    expect(err.isTimeout()).toBe(false);
    expect(err.statusCode).toBe(0);
    expect(err.retryAfterMs).toBe(2500);
    expect(err.name).toBe('CircuitOpenError');
    expect(err.message).toBe(
      'Circuit breaker open for /markets/ after 5 failures (retry after 3s)',
    );
  });

  it.each([
    ['VALIDATION_ERROR' as const],
    ['NO_AUTH_TOKEN' as const],
    ['CONFIGURATION_ERROR' as const],
  ])('EsiConfigurationError carries %s as code and prefix', (code) => {
    const err = new EsiConfigurationError(code, 'bad setup');
    expect(err).toBeInstanceOf(EsiFaultError);
    expect(err).toBeInstanceOf(EsiError);
    expect(isConfigurationError(err)).toBe(true);
    expect(isFaultError(err)).toBe(true);
    expect(err.code).toBe(code);
    expect(err.message).toBe(`[${code}] bad setup`);
    expect(err.retryable).toBe(false);
    expect(err.isTimeout()).toBe(false);
    expect(err.name).toBe('EsiConfigurationError');
  });

  it('EsiParseError is JSON_PARSE_ERROR with the parser error as cause', () => {
    const cause = new SyntaxError('Unexpected end of JSON input');
    const err = new EsiParseError(
      'Invalid JSON response: x',
      'https://esi.evetech.net/x',
      cause,
    );
    expect(isParseError(err)).toBe(true);
    expect(err.code).toBe('JSON_PARSE_ERROR');
    expect(err.cause).toBe(cause);
    expect(err.url).toBe('https://esi.evetech.net/x');
    expect(err.retryable).toBe(false);
  });

  it('EsiPaginationError sanitises the URL in its message and url field', () => {
    const cause = new Error('boom');
    const err = new EsiPaginationError(
      'https://esi.evetech.net/x/?token=secret&page=2',
      cause,
    );
    expect(isPaginationError(err)).toBe(true);
    expect(err.code).toBe('PAGINATION_INCOMPLETE');
    expect(err.message).not.toContain('secret');
    expect(err.url).not.toContain('secret');
    expect(err.message).toBe(
      '[PAGINATION_INCOMPLETE] Pagination incomplete for https://esi.evetech.net/x/?token=%5BREDACTED%5D&page=2: boom',
    );
    expect(err.cause).toBe(cause);
  });

  it('EsiTokenRefreshError keeps what the provider threw on cause', () => {
    class Revoked extends Error {}
    const cause = new Revoked('invalid_grant');
    const err = new EsiTokenRefreshError(cause);
    expect(isTokenRefreshError(err)).toBe(true);
    expect(err.code).toBe('TOKEN_REFRESH_FAILED');
    expect(err.message).toBe(
      '[TOKEN_REFRESH_FAILED] Token refresh failed: invalid_grant',
    );
    expect(err.cause).toBe(cause);
    expect(err.retryable).toBe(false);
  });

  it('toEsiError passes EsiErrors through and wraps anything else once', () => {
    const esi = new EsiError(404, 'Not Found');
    expect(toEsiError(esi)).toBe(esi);

    const original = new Error('kaboom');
    const wrapped = toEsiError(original);
    expect(wrapped).toBeInstanceOf(EsiFaultError);
    expect((wrapped as EsiFaultError).code).toBe('ESIJS_ERROR');
    expect(wrapped.message).toBe('[ESIJS_ERROR] kaboom');
    expect(wrapped.cause).toBe(original);
    expect(wrapped.retryable).toBe(false);

    expect(toEsiError('text').message).toBe('[ESIJS_ERROR] text');

    const fault = new EsiConfigurationError('NO_AUTH_TOKEN', 'no token');
    expect(toEsiError(fault)).toBe(fault);
  });
});
