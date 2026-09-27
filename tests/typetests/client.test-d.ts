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
} from '../../src/client';

declare const esi: Esi;

// The public view is the PublicScopeTree: public operations compile, an
// authenticated one does not (#183).
expectType<PublicScopeTree>(esi.public);
void esi.public.status.get();
void esi.public.character(1).portrait.get();
expectError(esi.public.character(1).wallet);
expectError(esi.public.corporation(1).wallets);

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
