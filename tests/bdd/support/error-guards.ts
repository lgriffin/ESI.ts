/**
 * What 0066-error-classification.feature applies to a rejection: every error
 * type guard the root and `./errors` entries export for EsiError.
 */
import {
  isEsiError,
  isForbidden,
  isNotFound,
  isRateLimited,
  isRetryable,
  isServerError,
  isTimeout,
  isUnauthorized,
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
};

/** The names of the guards that answer true for `error`, in table order. */
export function guardsSatisfiedBy(error: unknown): string[] {
  return Object.entries(ERROR_GUARDS)
    .filter(([, guard]) => guard(error))
    .map(([name]) => name);
}
