const SENSITIVE_PARAMS = [
  'token',
  'access_token',
  'api_key',
  'refresh_token',
  'client_secret',
  'code',
  'key',
  'secret',
  'auth',
  'password',
  'bearer',
];

export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    for (const param of SENSITIVE_PARAMS) {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    }
    return parsed.toString();
  } catch {
    const qIndex = url.indexOf('?');
    return qIndex >= 0 ? url.substring(0, qIndex) + '?[params-redacted]' : url;
  }
}

export class EsiError extends Error {
  public readonly url?: string;

  constructor(
    public readonly statusCode: number,
    message: string,
    url?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'EsiError';
    this.url = sanitizeUrl(url);
  }

  isRateLimited(): boolean {
    return this.statusCode === 420 || this.statusCode === 429;
  }

  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  isForbidden(): boolean {
    return this.statusCode === 403;
  }

  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  isTimeout(): boolean {
    return this.statusCode === 0;
  }

  get retryable(): boolean {
    return (
      this.statusCode === 0 ||
      this.statusCode === 420 ||
      this.statusCode === 429 ||
      this.statusCode === 502 ||
      this.statusCode === 503 ||
      this.statusCode === 504
    );
  }
}

export function isEsiError(error: unknown): error is EsiError {
  return error instanceof EsiError;
}

export function isRateLimited(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isRateLimited();
}

export function isNotFound(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isNotFound();
}

export function isUnauthorized(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isUnauthorized();
}

export function isForbidden(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isForbidden();
}

export function isServerError(error: unknown): error is EsiError {
  return error instanceof EsiError && error.isServerError();
}

export class TimeoutError extends EsiError {
  constructor(
    public readonly timeoutMs: number,
    url?: string,
    requestId?: string,
  ) {
    super(0, `Request timed out after ${timeoutMs}ms`, url, requestId);
    this.name = 'TimeoutError';
  }
}

export function isTimeout(error: unknown): error is TimeoutError {
  return error instanceof TimeoutError;
}

export function isRetryable(error: unknown): error is EsiError {
  return error instanceof EsiError && error.retryable;
}

/**
 * Raised by the circuit breaker before a request is sent, while the breaker
 * for its endpoint is open or its half-open probe slot is taken. Status `0`;
 * never retried by the client (wait `retryAfterMs` instead).
 */
export class CircuitOpenError extends EsiError {
  readonly endpoint: string;
  readonly failures: number;
  readonly retryAfterMs: number;

  constructor(endpoint: string, failures: number, retryAfterMs: number) {
    super(
      0,
      `Circuit breaker open for ${endpoint} after ${failures} failures (retry after ${Math.ceil(retryAfterMs / 1000)}s)`,
    );
    this.name = 'CircuitOpenError';
    this.endpoint = endpoint;
    this.failures = failures;
    this.retryAfterMs = retryAfterMs;
  }

  override get retryable(): boolean {
    return false;
  }

  override isTimeout(): boolean {
    return false;
  }
}

export function isCircuitOpen(error: unknown): error is CircuitOpenError {
  return error instanceof CircuitOpenError;
}

/**
 * A request that failed below HTTP: DNS, a reset connection, TLS, or a body
 * that stopped arriving. Status `0`, retryable; the underlying error is on
 * `cause`. A timeout is a {@link TimeoutError} instead.
 */
export class EsiNetworkError extends EsiError {
  override readonly cause: unknown;

  constructor(reason: string, url?: string, cause?: unknown) {
    super(0, `Network request failed: ${reason}`, url);
    this.name = 'EsiNetworkError';
    this.cause = cause;
  }

  override isTimeout(): boolean {
    return false;
  }
}

export function isNetworkError(error: unknown): error is EsiNetworkError {
  return error instanceof EsiNetworkError;
}

/** The code carried by an {@link EsiFaultError}; also its message prefix. */
export type EsiFaultCode =
  | 'VALIDATION_ERROR'
  | 'NO_AUTH_TOKEN'
  | 'CONFIGURATION_ERROR'
  | 'JSON_PARSE_ERROR'
  | 'PAGINATION_INCOMPLETE'
  | 'TOKEN_REFRESH_FAILED'
  | 'ESIJS_ERROR';

/**
 * A failure raised by the library itself rather than by ESI: bad
 * configuration or arguments, an unparseable body, an interrupted page walk,
 * a failed token refresh, or an unexpected error. Status `0`, never
 * retryable. The message starts with `[<code>]`.
 */
export class EsiFaultError extends EsiError {
  readonly code: EsiFaultCode;
  override readonly cause: unknown;

  constructor(
    code: EsiFaultCode,
    message: string,
    url?: string,
    cause?: unknown,
  ) {
    super(0, `[${code}] ${message}`, url);
    this.name = 'EsiFaultError';
    this.code = code;
    this.cause = cause;
  }

  override get retryable(): boolean {
    return false;
  }

  override isTimeout(): boolean {
    return false;
  }
}

export function isFaultError(error: unknown): error is EsiFaultError {
  return error instanceof EsiFaultError;
}

/**
 * The client's setup or a call's arguments are wrong: an invalid base URL or
 * parameter (`VALIDATION_ERROR`), no access token for an authenticated
 * endpoint (`NO_AUTH_TOKEN`), or a missing dependency
 * (`CONFIGURATION_ERROR`). Fix the code; retrying cannot help.
 */
export class EsiConfigurationError extends EsiFaultError {
  constructor(
    code: 'VALIDATION_ERROR' | 'NO_AUTH_TOKEN' | 'CONFIGURATION_ERROR',
    message: string,
  ) {
    super(code, message);
    this.name = 'EsiConfigurationError';
  }
}

export function isConfigurationError(
  error: unknown,
): error is EsiConfigurationError {
  return error instanceof EsiConfigurationError;
}

/** A response body that is not the JSON it should be (`JSON_PARSE_ERROR`). */
export class EsiParseError extends EsiFaultError {
  constructor(message: string, url?: string, cause?: unknown) {
    super('JSON_PARSE_ERROR', message, url, cause);
    this.name = 'EsiParseError';
  }
}

export function isParseError(error: unknown): error is EsiParseError {
  return error instanceof EsiParseError;
}

/**
 * A page walk that stopped part way on a failure that is not itself an
 * `EsiError` (`PAGINATION_INCOMPLETE`). The page's error is on `cause`.
 */
export class EsiPaginationError extends EsiFaultError {
  constructor(where: string, cause: unknown) {
    const safeWhere = sanitizeUrl(where) ?? where;
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(
      'PAGINATION_INCOMPLETE',
      `Pagination incomplete for ${safeWhere}: ${reason}`,
      where,
      cause,
    );
    this.name = 'EsiPaginationError';
  }
}

export function isPaginationError(error: unknown): error is EsiPaginationError {
  return error instanceof EsiPaginationError;
}

/**
 * The token provider threw while refreshing after a 401
 * (`TOKEN_REFRESH_FAILED`). What it threw, such as a `TokenRevokedError` or
 * `SsoError`, is on `cause`.
 */
export class EsiTokenRefreshError extends EsiFaultError {
  constructor(cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(
      'TOKEN_REFRESH_FAILED',
      `Token refresh failed: ${reason}`,
      undefined,
      cause,
    );
    this.name = 'EsiTokenRefreshError';
  }
}

export function isTokenRefreshError(
  error: unknown,
): error is EsiTokenRefreshError {
  return error instanceof EsiTokenRefreshError;
}

/**
 * Wrap anything that is not already an `EsiError` so every failure the
 * client surfaces is one (`ESIJS_ERROR`, original on `cause`).
 */
export function toEsiError(error: unknown): EsiError {
  if (error instanceof EsiError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new EsiFaultError('ESIJS_ERROR', message, undefined, error);
}

export type ValidationDirection = 'request' | 'response';

export class EsiValidationError extends EsiError {
  public readonly validationError: unknown;
  public readonly direction: ValidationDirection;

  constructor(
    url: string,
    zodError: unknown,
    requestId?: string,
    direction: ValidationDirection = 'response',
  ) {
    const safeUrl = sanitizeUrl(url) ?? url;
    const label = direction === 'request' ? 'Request body' : 'Response';
    super(0, `${label} validation failed for ${safeUrl}`, url, requestId);
    this.name = 'EsiValidationError';
    this.validationError = zodError;
    this.direction = direction;
  }

  /** The same request returns the same body, so a retry cannot help. */
  override get retryable(): boolean {
    return false;
  }

  override isTimeout(): boolean {
    return false;
  }
}

export function isValidationError(error: unknown): error is EsiValidationError {
  return error instanceof EsiValidationError;
}
