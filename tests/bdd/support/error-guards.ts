/**
 * What 0066-error-classification.feature applies to an error: every error
 * type guard the root and `./errors` entries export for EsiError and its
 * subclasses, and one instance of each error the client raises.
 */
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
  isForbidden,
  isNetworkError,
  isNotFound,
  isPaginationError,
  isParseError,
  isRateLimited,
  isRetryable,
  isServerError,
  isTimeout,
  isTokenRefreshError,
  isUnauthorized,
  isValidationError,
} from '../../../src/errors';

export const ERROR_GUARDS: Record<string, (error: unknown) => boolean> = {
  isEsiError,
  isRateLimited,
  isNotFound,
  isUnauthorized,
  isForbidden,
  isServerError,
  isTimeout,
  isRetryable,
  isValidationError,
  isCircuitOpen,
  isNetworkError,
  isFaultError,
  isConfigurationError,
  isParseError,
  isPaginationError,
  isTokenRefreshError,
};

/** The names of the guards that answer true for `error`, in table order. */
export function guardsSatisfiedBy(error: unknown): string[] {
  return Object.entries(ERROR_GUARDS)
    .filter(([, guard]) => guard(error))
    .map(([name]) => name);
}

const URL = 'https://esi.evetech.net/characters/1/wallet';

/** One error of each kind the client raises, by the name a scenario uses. */
export const RAISED_ERRORS: Record<string, () => unknown> = {
  'status 420': () => new EsiError(420, 'Error limited', URL),
  'status 429': () => new EsiError(429, 'Too many requests', URL),
  'status 502': () => new EsiError(502, 'Bad gateway', URL),
  'status 504': () => new EsiError(504, 'Gateway timeout', URL),
  TimeoutError: () => new TimeoutError(5000, URL),
  CircuitOpenError: () =>
    new CircuitOpenError('/characters/1/wallet', 5, 30000),
  EsiNetworkError: () => new EsiNetworkError('ECONNRESET', URL),
  EsiValidationError: () => new EsiValidationError(URL, new Error('shape')),
  EsiFaultError: () => new EsiFaultError('ESIJS_ERROR', 'failed', URL),
  EsiConfigurationError: () =>
    new EsiConfigurationError('NO_AUTH_TOKEN', 'no token'),
  EsiParseError: () => new EsiParseError('not JSON', URL),
  EsiPaginationError: () => new EsiPaginationError(URL, new Error('page 2')),
  EsiTokenRefreshError: () => new EsiTokenRefreshError(new Error('revoked')),
};
