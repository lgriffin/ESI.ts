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

/**
 * Matches text that may carry a query parameter `sanitizeUrl` redacts: one of
 * the names above, or a percent-encoded name it could decode to. A cheap
 * prefilter, so a line without one skips URL parsing entirely.
 */
export const SENSITIVE_QUERY_PATTERN: RegExp = new RegExp(
  `[?&](?:(?:${SENSITIVE_PARAMS.join('|')})(?![A-Za-z0-9_])|[^?&=\\s]*%)`,
);

const SENSITIVE_PARAM_SET: ReadonlySet<string> = new Set(SENSITIVE_PARAMS);

/**
 * Whether a query parameter name, as written in a URL (percent-encoded or
 * not), is one `sanitizeUrl` redacts.
 */
export function isSensitiveQueryParam(rawName: string): boolean {
  if (SENSITIVE_PARAM_SET.has(rawName)) return true;
  try {
    return SENSITIVE_PARAM_SET.has(
      decodeURIComponent(rawName.replace(/\+/g, ' ')),
    );
  } catch {
    return false;
  }
}

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
  public readonly url?: string | undefined;

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
 * Why a page walk stopped before it held the whole collection:
 *
 * - `page-cap`: page 1 reported more pages than the client requests for one
 *   call (1000, security model P8). The walk stops after page 1.
 * - `empty-page`: a page after the first that page 1 reported came back with
 *   no items, so the collection shrank while it was walked.
 * - `cursor-cap`: a cursor walk reached its page limit while the last page
 *   still carried an `after` cursor.
 * - `fetch-failed`: a page failed with an error that is not itself an
 *   `EsiError`, which is on `cause`.
 */
export type PaginationStopReason =
  'page-cap' | 'empty-page' | 'cursor-cap' | 'fetch-failed';

/** What a pagination path knows when it stops part way. Every field is optional. */
export interface EsiPaginationErrorDetails {
  /** Default `fetch-failed`. */
  readonly reason?: PaginationStopReason;
  /** The endpoint path the walk started from. Default: `where`. */
  readonly endpoint?: string;
  /** The page count page 1 reported; omitted on a cursor walk. */
  readonly reportedPages?: number;
  /** Pages the walk read in order, the page it stopped at included. Default 0. */
  readonly fetchedPages?: number;
  /** Items collected before the stop, in page order. Default none. */
  readonly partial?: readonly unknown[];
  /** Items the walk delivered before the stop. Default: `partial.length`. */
  readonly itemCount?: number;
}

/** The message text for a stop that has no underlying error. */
function describePaginationStop(
  reason: PaginationStopReason,
  d: EsiPaginationErrorDetails,
): string {
  switch (reason) {
    case 'page-cap':
      return `ESI reported ${d.reportedPages} pages, more than the client requests for one call`;
    case 'empty-page':
      return `page ${d.fetchedPages} of ${d.reportedPages} was empty, so the collection changed during the walk`;
    case 'cursor-cap':
      return `stopped at the ${d.fetchedPages}-page limit with an after cursor still set`;
    case 'fetch-failed':
      return `stopped after ${d.fetchedPages ?? 0} pages`;
  }
}

/**
 * A page walk that stopped before it held the whole collection
 * (`PAGINATION_INCOMPLETE`). `reason` says why; `partial` holds the items
 * collected before the stop, so a caller can use or discard them knowingly.
 * When a page failed with an error that is not itself an `EsiError`, that
 * error is on `cause`.
 */
export class EsiPaginationError extends EsiFaultError {
  /** Why the walk stopped. */
  readonly reason: PaginationStopReason;
  /** The endpoint path the walk started from. */
  readonly endpoint: string;
  /** The page count page 1 reported; `undefined` on a cursor walk. */
  readonly reportedPages: number | undefined;
  /** Pages read in order before the stop, the page it stopped at included. */
  readonly fetchedPages: number;
  /**
   * Items delivered before the stop: `partial.length`, except on a stream,
   * whose pages were already yielded and are counted but not carried.
   */
  readonly itemCount: number;
  /** Items collected before the stop, in page order. Frozen. */
  readonly partial: readonly unknown[];

  // The two-argument signature is kept as its own overload so the published
  // declaration still carries it unchanged (guides/SEMVER.md).
  constructor(where: string, cause: unknown);
  constructor(
    where: string,
    cause: unknown,
    details: EsiPaginationErrorDetails,
  );
  constructor(
    where: string,
    cause: unknown,
    details: EsiPaginationErrorDetails = {},
  ) {
    const safeWhere = sanitizeUrl(where) ?? where;
    const reason = details.reason ?? 'fetch-failed';
    const causeText = cause instanceof Error ? cause.message : String(cause);
    const text =
      cause === undefined ? describePaginationStop(reason, details) : causeText;
    super(
      'PAGINATION_INCOMPLETE',
      `Pagination incomplete for ${safeWhere}: ${text}`,
      where,
      cause,
    );
    this.name = 'EsiPaginationError';
    this.reason = reason;
    this.endpoint = sanitizeEndpoint(details.endpoint ?? where);
    this.reportedPages = details.reportedPages;
    this.fetchedPages = details.fetchedPages ?? 0;
    this.partial = Object.freeze([...(details.partial ?? [])]);
    this.itemCount = details.itemCount ?? this.partial.length;
  }
}

/**
 * An endpoint path with its sensitive query parameters redacted. A relative
 * path cannot go through `sanitizeUrl`, which would redact every parameter.
 */
function sanitizeEndpoint(endpoint: string): string {
  const q = endpoint.indexOf('?');
  if (/^https?:\/\//i.test(endpoint) || q < 0) {
    return sanitizeUrl(endpoint) ?? endpoint;
  }
  const params = endpoint
    .slice(q + 1)
    .split('&')
    .map((pair) => {
      const name = pair.split('=', 1)[0] ?? '';
      return isSensitiveQueryParam(name) ? `${name}=[REDACTED]` : pair;
    });
  return `${endpoint.slice(0, q)}?${params.join('&')}`;
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
