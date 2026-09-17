/**
 * The `@lgriffin/esi.ts/errors` entry point, imported the way a consumer
 * reaches it. Pins what a caller relies on: which constructor arguments are
 * required, each field's exact type, optionality and `readonly`, and that
 * every type guard narrows `unknown` to its class.
 */
import { expectAssignable, expectError, expectType } from 'tsd';
import {
  AuthError,
  CharacterNotFoundError,
  CircuitOpenError,
  EsiError,
  EsiValidationError,
  SsoError,
  TimeoutError,
  TokenDecodeError,
  TokenRevokedError,
  isAuthError,
  isCharacterNotFound,
  isEsiError,
  isForbidden,
  isNotFound,
  isRateLimited,
  isRetryable,
  isServerError,
  isSsoError,
  isTimeout,
  isTokenRevoked,
  isUnauthorized,
  isValidationError,
  sanitizeUrl,
} from '../../src/errors';
import type { ValidationDirection } from '../../src/errors';

/**
 * `true` when `K` is declared optional on `T`. Needed where the property's
 * read type is the same either way (`requestId?: string | undefined` versus
 * `requestId: string | undefined`).
 */
type IsOptional<T, K extends keyof T> = {} extends Pick<T, K> ? true : false;

const STATUS_URL = 'https://esi.evetech.net/latest/status/';
declare const caught: unknown;
declare const zodError: unknown;

// --- sanitizeUrl ---

expectType<string | undefined>(sanitizeUrl(STATUS_URL));
expectType<string | undefined>(sanitizeUrl());

// --- EsiError ---

const esiError = new EsiError(404, 'Not found');
expectType<EsiError>(esiError);
expectType<EsiError>(new EsiError(404, 'Not found', STATUS_URL, 'req-1'));
expectError(new EsiError(404));

expectType<number>(esiError.statusCode);
expectType<string | undefined>(esiError.url);
expectType<string | undefined>(esiError.requestId);
expectType<IsOptional<EsiError, 'url'>>(true);
expectType<IsOptional<EsiError, 'requestId'>>(true);

expectError((esiError.statusCode = 500));
expectError((esiError.url = STATUS_URL));
expectError((esiError.requestId = 'req-2'));

// --- TimeoutError ---

const timeoutError = new TimeoutError(5000);
expectType<TimeoutError>(timeoutError);
expectType<TimeoutError>(new TimeoutError(5000, STATUS_URL, 'req-1'));
expectError(new TimeoutError());
expectAssignable<EsiError>(timeoutError);

expectType<number>(timeoutError.timeoutMs);
expectError((timeoutError.timeoutMs = 1));

// --- EsiValidationError and ValidationDirection ---

declare const direction: ValidationDirection;
expectType<'request' | 'response'>(direction);

const validationError = new EsiValidationError(STATUS_URL, zodError);
expectType<EsiValidationError>(validationError);
expectType<EsiValidationError>(
  new EsiValidationError(STATUS_URL, zodError, 'req-1', 'request'),
);
expectType<EsiValidationError>(
  new EsiValidationError(STATUS_URL, zodError, undefined, 'response'),
);
expectError(new EsiValidationError(STATUS_URL));
expectError(new EsiValidationError(STATUS_URL, zodError, undefined, 'both'));
expectAssignable<EsiError>(validationError);

expectType<unknown>(validationError.validationError);
expectType<IsOptional<EsiValidationError, 'validationError'>>(false);
expectType<ValidationDirection>(validationError.direction);

expectError((validationError.validationError = zodError));
expectError((validationError.direction = 'request'));

// --- CircuitOpenError ---

const circuitOpen = new CircuitOpenError('/markets/10000002/orders/', 5, 30000);
expectType<CircuitOpenError>(circuitOpen);
expectError(new CircuitOpenError('/markets/10000002/orders/', 5));
expectAssignable<Error>(circuitOpen);

expectType<string>(circuitOpen.endpoint);
expectType<number>(circuitOpen.failures);
expectType<number>(circuitOpen.retryAfterMs);

expectError((circuitOpen.endpoint = '/status/'));
expectError((circuitOpen.failures = 0));
expectError((circuitOpen.retryAfterMs = 0));

// --- AuthError and subclasses ---

expectType<AuthError>(new AuthError('auth failed'));
expectError(new AuthError());
expectAssignable<Error>(new AuthError('auth failed'));

const ssoError = new SsoError(400, 'invalid_grant');
expectType<SsoError>(ssoError);
expectType<SsoError>(new SsoError(400, 'invalid_grant', 'token expired'));
expectError(new SsoError(400));
expectAssignable<AuthError>(ssoError);

expectType<number>(ssoError.statusCode);
expectType<string>(ssoError.errorCode);
expectType<string | undefined>(ssoError.errorDescription);
expectType<boolean>(ssoError.isRetryable());

expectError((ssoError.statusCode = 500));
expectError((ssoError.errorCode = 'invalid_client'));
expectError((ssoError.errorDescription = 'changed'));

const tokenRevoked = new TokenRevokedError('revoked');
expectType<TokenRevokedError>(tokenRevoked);
expectType<TokenRevokedError>(new TokenRevokedError('revoked', 2112625428));
expectError(new TokenRevokedError());
expectAssignable<AuthError>(tokenRevoked);

expectType<number | undefined>(tokenRevoked.characterId);
expectError((tokenRevoked.characterId = 1));

expectType<TokenDecodeError>(new TokenDecodeError('malformed JWT'));
expectError(new TokenDecodeError());
expectAssignable<AuthError>(new TokenDecodeError('malformed JWT'));

const characterNotFound = new CharacterNotFoundError(2112625428);
expectType<CharacterNotFoundError>(characterNotFound);
expectError(new CharacterNotFoundError());
expectAssignable<AuthError>(characterNotFound);

expectType<number>(characterNotFound.characterId);
expectError((characterNotFound.characterId = 1));

// --- Type guards narrow unknown and require their argument ---

if (isEsiError(caught)) expectType<EsiError>(caught);
if (isRateLimited(caught)) expectType<EsiError>(caught);
if (isNotFound(caught)) expectType<EsiError>(caught);
if (isUnauthorized(caught)) expectType<EsiError>(caught);
if (isForbidden(caught)) expectType<EsiError>(caught);
if (isServerError(caught)) expectType<EsiError>(caught);
if (isRetryable(caught)) expectType<EsiError>(caught);
if (isTimeout(caught)) expectType<TimeoutError>(caught);
if (isValidationError(caught)) expectType<EsiValidationError>(caught);
if (isAuthError(caught)) expectType<AuthError>(caught);
if (isSsoError(caught)) expectType<SsoError>(caught);
if (isTokenRevoked(caught)) expectType<TokenRevokedError>(caught);
if (isCharacterNotFound(caught)) {
  expectType<CharacterNotFoundError>(caught);
}

expectError(isEsiError());
expectError(isRateLimited());
expectError(isNotFound());
expectError(isUnauthorized());
expectError(isForbidden());
expectError(isServerError());
expectError(isRetryable());
expectError(isTimeout());
expectError(isValidationError());
expectError(isAuthError());
expectError(isSsoError());
expectError(isTokenRevoked());
expectError(isCharacterNotFound());
