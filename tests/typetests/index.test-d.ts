import { expectError, expectType } from 'tsd';
import {
  EsiClient,
  EsiError,
  isEsiError,
  isRateLimited,
  isNotFound,
  isServerError,
  isTimeout,
  isValidationError,
  CircuitBreaker,
  RateLimiter,
  ETagCacheManager,
  buildEndpointPath,
  type IncompletePagesMode,
} from '../../src';

// EsiClient construction
expectType<EsiClient>(new EsiClient({}));

// The legacy config takes the same incompletePages modes as createEsi (DES-08).
expectType<EsiClient>(new EsiClient({ incompletePages: 'throw' }));
expectType<EsiClient>(new EsiClient({ incompletePages: 'truncate' }));
expectError(new EsiClient({ incompletePages: 'fail' }));
expectError<IncompletePagesMode>('fail');

// Error type guards return boolean
expectType<boolean>(isEsiError(new Error()));
expectType<boolean>(isRateLimited(new Error()));
expectType<boolean>(isNotFound(new Error()));
expectType<boolean>(isServerError(new Error()));
expectType<boolean>(isTimeout(new Error()));
expectType<boolean>(isValidationError(new Error()));

// EsiError is an Error subclass with statusCode
const esiError = new EsiError(404, 'Not found');
expectType<EsiError>(esiError);
expectType<string>(esiError.message);
expectType<number>(esiError.statusCode);

// Core infrastructure constructors
expectType<CircuitBreaker>(new CircuitBreaker());
expectType<RateLimiter>(new RateLimiter());
expectType<ETagCacheManager>(new ETagCacheManager());

// buildEndpointPath returns the correct shape
const pathResult = buildEndpointPath(
  {
    path: 'test/{id}/',
    method: 'GET',
    requiresAuth: false,
    pathParams: ['id'],
  },
  [123],
);
expectType<string>(pathResult.path);
expectType<unknown>(pathResult.body);
