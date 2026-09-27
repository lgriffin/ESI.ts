import { expectType, expectAssignable } from 'tsd';
import {
  EsiError,
  isEsiError,
  isRateLimited,
  isNotFound,
  isServerError,
  isTimeout,
  isValidationError,
  isCircuitOpen,
  CircuitOpenError,
} from '../../src';
import { TimeoutError, EsiValidationError } from '../../src/core/util/error';

// --- Type guard narrowing ---

declare const err: unknown;

if (isEsiError(err)) {
  expectType<EsiError>(err);
  expectType<number>(err.statusCode);
  expectType<string>(err.message);
  expectType<string | undefined>(err.url);
}

if (isRateLimited(err)) {
  expectType<EsiError>(err);
  expectType<number>(err.statusCode);
}

if (isNotFound(err)) {
  expectType<EsiError>(err);
}

if (isServerError(err)) {
  expectType<EsiError>(err);
}

if (isTimeout(err)) {
  expectType<TimeoutError>(err);
  expectType<number>(err.timeoutMs);
}

if (isValidationError(err)) {
  expectType<EsiValidationError>(err);
  expectType<unknown>(err.validationError);
}

// --- EsiError instance methods ---

const esiErr = new EsiError(404, 'Not found', 'https://esi.evetech.net/test');
expectType<boolean>(esiErr.isRateLimited());
expectType<boolean>(esiErr.isNotFound());
expectType<boolean>(esiErr.isUnauthorized());
expectType<boolean>(esiErr.isForbidden());
expectType<boolean>(esiErr.isServerError());
expectType<boolean>(esiErr.isTimeout());
expectType<boolean>(esiErr.retryable);
expectType<string | undefined>(esiErr.requestId);

// TimeoutError extends EsiError
const timeout = new TimeoutError(5000, 'https://esi.evetech.net/test');
expectAssignable<EsiError>(timeout);
expectType<number>(timeout.timeoutMs);
expectType<number>(timeout.statusCode);

// isCircuitOpen narrows to CircuitOpenError
if (isCircuitOpen(err)) {
  expectType<CircuitOpenError>(err);
  expectType<string>(err.endpoint);
  expectType<number>(err.failures);
  expectType<number>(err.retryAfterMs);
}

// --- ./errors carries every error export the root carries, with one type ---

import * as errorsEntry from '../../src/errors';
import * as rootEntry from '../../src';
import {
  EsiNetworkError,
  EsiFaultError,
  EsiConfigurationError,
  EsiFaultCode,
  isNetworkError,
  isFaultError,
  isConfigurationError,
  isParseError,
  isPaginationError,
  isTokenRefreshError,
  EsiParseError,
  EsiPaginationError,
  EsiTokenRefreshError,
} from '../../src/errors';

expectAssignable<Pick<typeof rootEntry, keyof typeof errorsEntry>>(errorsEntry);
expectType<typeof rootEntry.isCircuitOpen>(errorsEntry.isCircuitOpen);

if (isNetworkError(err)) {
  expectType<EsiNetworkError>(err);
  expectAssignable<EsiError>(err);
}
if (isFaultError(err)) {
  expectType<EsiFaultError>(err);
  expectType<EsiFaultCode>(err.code);
}
if (isConfigurationError(err)) {
  expectType<EsiConfigurationError>(err);
}
if (isParseError(err)) {
  expectType<EsiParseError>(err);
}
if (isPaginationError(err)) {
  expectType<EsiPaginationError>(err);
}
if (isTokenRefreshError(err)) {
  expectType<EsiTokenRefreshError>(err);
  expectType<unknown>(err.cause);
}
expectAssignable<EsiError>(new CircuitOpenError('/x', 1, 1000));
