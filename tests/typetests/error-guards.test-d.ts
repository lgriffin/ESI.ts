import { expectType, expectAssignable } from 'tsd';
import {
  EsiError,
  isEsiError,
  isRateLimited,
  isNotFound,
  isServerError,
  isTimeout,
  isValidationError,
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
