import { expectAssignable, expectError, expectType } from 'tsd';
import {
  EsiApiFactory,
  EsiClient,
  EsiClientBuilder,
  identityFromProvider,
  identityFromToken,
  type CacheInvalidation,
  type CustomEsiClient,
  type EsiDiagnostics,
  type Identity,
} from '../../src';

// EsiClient.as(identity) hands back an EsiClient view.
const client = new EsiClient({});
const identity = identityFromToken('token');
expectType<Identity>(identity);
expectType<Identity>(identityFromProvider(() => Promise.resolve('token')));
const view = client.as(identity);
expectType<EsiClient>(view);
expectType<EsiClient>(view.as(identity));
expectType<Promise<number>>(view.wallet.getCharacterWallet(1));

// CustomEsiClient.as(identity) hands back a CustomEsiClient view.
const custom = new EsiClientBuilder().addClient('wallet').build();
const customView = custom.as(identity);
expectType<CustomEsiClient>(customView);
expectType<CustomEsiClient>(customView.as(identity));

// Anything that is not an Identity is refused, on both surfaces.
expectError(client.as('token'));
expectError(client.as({}));
expectError(client.as({ accessToken: 'token' }));
expectError(client.as({ accessToken: () => 'not a promise' }));
expectError(custom.as('token'));
expectError(custom.as({ accessToken: () => 'not a promise' }));
expectError(client.as());

// A standalone domain client reads and shuts down its own pipeline.
const market = EsiApiFactory.createClient('market');
expectType<ReturnType<typeof EsiApiFactory.createClient>>(market);
expectType<EsiDiagnostics>(market.diagnostics);
expectType<void>(market.shutdown());
// A domain client reached through EsiClient has the same members.
expectType<EsiDiagnostics>(client.market.diagnostics);
expectType<void>(client.market.shutdown());

// CacheInvalidation is the closed union a shared store carries.
declare const event: CacheInvalidation;
if (event.kind === 'path') {
  expectType<string>(event.path);
} else {
  expectType<'clear'>(event.kind);
}
expectAssignable<CacheInvalidation>({
  kind: 'path',
  path: 'characters/1/contacts',
});
expectAssignable<CacheInvalidation>({ kind: 'clear' });
expectError<CacheInvalidation>({ kind: 'path' });
expectError<CacheInvalidation>({ kind: 'flush' });
