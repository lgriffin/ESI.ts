import {
  expectAssignable,
  expectError,
  expectNotAssignable,
  expectType,
} from 'tsd';
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
  EsiClientBuilder,
  RequestDeduplicator,
  type CacheStats,
  type CacheStore,
  type CircuitBreakerStats,
  type Clock,
  type CustomEsiClient,
  type DomainClientName,
  type EsiDiagnostics,
  type EsiResponseMeta,
  type EsiResult,
  type IncompletePagesMode,
  type MetadataClients,
  type SafeModeClients,
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

// The custom clients take the middleware instances createEsi takes.
declare const store: CacheStore;
declare const clock: Clock;
expectType<EsiClient>(
  new EsiClient({
    cache: store,
    clock,
    rateLimiter: new RateLimiter(),
    circuitBreaker: new CircuitBreaker(),
    deduplicator: new RequestDeduplicator(),
  }),
);
expectType<EsiClient>(new EsiClient({ cache: new ETagCacheManager() }));
expectError(new EsiClient({ clock: { now: () => 0 } }));
const custom = new EsiClientBuilder()
  .addClient('status')
  .withConfig({ cache: store, clock })
  .build();

// CustomEsiClient has the diagnostics EsiClient has.
expectType<EsiDiagnostics>(custom.diagnostics);
expectType<CacheStats | null>(custom.getCacheStats());
expectType<CircuitBreakerStats | null>(custom.getCircuitBreakerStats());
expectType<void>(custom.clearCache());
expectType<void>(custom.updateCacheConfig({ maxEntries: 10 }));
expectType<void>(custom.resetCircuitBreaker('status'));

// Every domain client's metadata and safe-mode view from one call; the
// plain domain methods keep their return types.
declare const client: EsiClient;
expectType<MetadataClients<EsiClient>>(client.withMetadata());
expectType<SafeModeClients<EsiClient>>(client.withSafeMode());
const statusMeta = await client.withMetadata().status.getStatus();
expectType<EsiResponseMeta>(statusMeta.meta);
expectType<number>(statusMeta.data.players);
const statusResult = await client.withSafeMode().status.getStatus();
expectType<EsiResult<Awaited<ReturnType<typeof client.status.getStatus>>>>(
  statusResult,
);
expectType<number>((await client.status.getStatus()).players);
expectError(client.withMetadata().diagnostics);
expectError(client.withMetadata().withMetadata);

// A CustomEsiClient's views may lack a domain, as its getters may.
declare const built: CustomEsiClient;
const maybeStatus = built.withMetadata().status;
expectType<
  ReturnType<NonNullable<CustomEsiClient['status']>['withMetadata']> | undefined
>(maybeStatus);
if (maybeStatus) {
  expectType<EsiResponseMeta>((await maybeStatus.getStatus()).meta);
}
expectType<
  ReturnType<NonNullable<CustomEsiClient['market']>['withSafeMode']> | undefined
>(built.withSafeMode().market);

// The domain names are the client's domain getters, and nothing else.
expectAssignable<DomainClientName<EsiClient>>('market');
expectAssignable<DomainClientName<CustomEsiClient>>('accessLists');
expectNotAssignable<DomainClientName<EsiClient>>('diagnostics');
expectNotAssignable<DomainClientName<EsiClient>>('withMetadata');
