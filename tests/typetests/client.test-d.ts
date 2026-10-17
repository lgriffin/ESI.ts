import { expectAssignable, expectError, expectType } from 'tsd';
import {
  createEsi,
  identityFromProvider,
  identityFromToken,
  type Esi,
  type Identity,
  type PublicScopeTree,
  type ScopeTree,
  type TokenProvider,
  type CachedResponse,
  type LogFields,
  type OperationPagination,
  type ProviderIdentityOptions,
  type QueryValue,
  type CacheStats,
  type CacheStore,
  type CircuitBreakerStats,
  type Clock,
  type EsiViews,
  type ICircuitBreaker,
  type IDeduplicator,
  type IRateLimiter,
  type MetadataView,
  type OperationResponse,
  type OperationResult,
  type RateLimitGroupStatus,
  type ResponseMeta,
  type ResponseRateLimit,
  type RuntimeDiagnostics,
  type SafeView,
  type IncompletePagesMode,
} from '../../src/client';
import type { EsiError } from '../../src/errors';

declare const esi: Esi;

// The public view is the PublicScopeTree: public operations compile, an
// authenticated one does not (#183).
expectType<PublicScopeTree>(esi.public);
void esi.public.status.get();
void esi.public.character(1).portrait.get();
expectError(esi.public.character(1).wallet);
expectError(esi.public.corporation(1).wallets);

// shutdown() is on the runtime, once, and returns nothing.
expectType<void>(esi.shutdown());

// as() returns the full tree, where the same operations exist.
declare const identity: Identity;
const view = esi.as(identity);
expectType<ScopeTree>(view);
expectType<Promise<number>>(view.character(1).wallet.get());
expectAssignable<PublicScopeTree>(view);

// The runtime has no setters: nothing on it takes a token after construction.
expectError(esi.setAccessToken);
expectError(esi.public.setAccessToken);

// The user agent is required.
expectError(createEsi({}));
expectError(createEsi({ baseUrl: 'https://esi.evetech.net' }));
expectType<Esi>(createEsi({ userAgent: 'app/1.0 (dev@example.com)' }));

// incompletePages takes the two modes and nothing else (DES-08).
expectType<Esi>(
  createEsi({
    userAgent: 'app/1.0 (dev@example.com)',
    incompletePages: 'throw',
  }),
);
expectAssignable<IncompletePagesMode>('truncate');
expectError<IncompletePagesMode>('fail');
expectError(
  createEsi({
    userAgent: 'app/1.0 (dev@example.com)',
    incompletePages: 'fail',
  }),
);

// Identities: from a token, from a provider, or anything with the members.
expectType<Identity>(identityFromToken('token'));
declare const provider: TokenProvider;
expectType<Identity>(identityFromProvider(provider, { characterId: 1 }));
expectAssignable<Identity>({ accessToken: () => Promise.resolve('t') });
expectAssignable<Identity>({
  characterId: 1,
  accessToken: () => Promise.resolve('t'),
  refreshAccessToken: () => Promise.resolve('t2'),
});
expectError(esi.as({ accessToken: () => 'not a promise' }));

// The ports the entry exports, as a consumer implementing one sees them.
expectAssignable<CachedResponse>({
  etag: '"v1"',
  data: {},
  headers: {},
  timestamp: 0,
});
expectAssignable<LogFields>({ endpoint: '/status', status: 200 });
expectAssignable<OperationPagination>('page');
expectError<OperationPagination>('offset');
expectAssignable<QueryValue>(['a', 1, true]);
expectAssignable<ProviderIdentityOptions>({ characterId: 1 });

// Metadata views (G8): single-answer operations resolve { data, meta };
// paginated ones still yield items; the public view still leaves the
// authenticated operations out.
const withMeta = esi.withMetadata();
expectType<EsiViews<MetadataView<PublicScopeTree>, MetadataView<ScopeTree>>>(
  withMeta,
);
expectType<Promise<OperationResponse<number>>>(
  withMeta.as(identity).character(1).wallet.get(),
);
declare const meta: ResponseMeta;
expectType<boolean>(meta.fromCache);
expectType<string | undefined>(meta.etag);
expectType<number | undefined>(meta.pages);
expectType<ResponseRateLimit | undefined>(meta.rateLimit);
expectError(withMeta.public.character(1).wallet);
void withMeta.as(identity).character(1).assets.get()[Symbol.asyncIterator];

// Safe mode (G8): a result to narrow on ok, never a rejection.
const safe = esi.withSafeMode();
expectType<EsiViews<SafeView<PublicScopeTree>, SafeView<ScopeTree>>>(safe);
const result = await safe.as(identity).character(1).wallet.get();
expectType<OperationResult<number>>(result);
if (result.ok) {
  expectType<number>(result.data);
  expectType<ResponseMeta>(result.meta);
} else {
  expectType<EsiError>(result.error);
}

// Diagnostics (G9): on the runtime and as one object.
expectType<RuntimeDiagnostics>(esi.diagnostics);
expectType<CacheStats | null>(esi.getCacheStats());
expectType<CircuitBreakerStats | null>(esi.getCircuitBreakerStats());
expectType<void>(esi.clearCache());
expectType<void>(esi.updateCacheConfig({ maxEntries: 10 }));
expectType<void>(esi.resetCircuitBreaker('status'));
expectType<{ pendingRequests: number } | null>(
  esi.diagnostics.getDeduplicatorStats(),
);

// Supplied middleware (G11): instances go in the options next to the config.
declare const store: CacheStore;
declare const clock: Clock;
declare const rateLimiter: IRateLimiter;
declare const circuitBreaker: ICircuitBreaker;
declare const deduplicator: IDeduplicator;
expectType<Esi>(
  createEsi({
    userAgent: 'app/1.0 (dev@example.com)',
    cache: store,
    clock,
    rateLimiter,
    circuitBreaker,
    deduplicator,
  }),
);
expectError(createEsi({ userAgent: 'app/1.0', clock: { now: () => 0 } }));
declare const group: RateLimitGroupStatus;
expectType<number>(group.remaining);
// A response-schema override (scripts/spec/response-schema-overrides.json)
// widens only the generated Zod schema in 12.x: the operation's TypeScript
// type keeps the document's shape, and widens in the next major (#659).
declare const bloodlines: Awaited<
  ReturnType<PublicScopeTree['universe']['bloodlines']['get']>
>;
expectType<number>(bloodlines[0]!.ship_type_id);
