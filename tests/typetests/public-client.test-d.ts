import { expectError, expectType } from 'tsd';
import {
  EsiClientBuilder,
  type ClientTypeMap,
  type PublicClient,
  type PublicCustomEsiClient,
  type PublicDomainClients,
} from '../../src';

const pub = new EsiClientBuilder()
  .addClients(['market', 'wallet', 'characters'])
  .buildPublic();
expectType<PublicCustomEsiClient>(pub);

// Public methods are there.
const market = pub.market!;
expectType<PublicClient<'market'>>(market);
void market.getMarketPrices();
void pub.characters!.getCharacterPublicInfo(1);

// A method that needs a token does not compile.
expectError(pub.wallet!.getCharacterWallet(1));
expectError(market.getCharacterOrders(1));

// Nor do the views and generic helpers that could reach one.
expectError(market.withMetadata());
expectError(market.streamEndpoint('getCharacterOrders'));

// Each accessor is the domain client minus its authenticated methods.
expectType<PublicDomainClients['wallet']>(pub.wallet);
expectType<ClientTypeMap['market']['getMarketPrices']>(market.getMarketPrices);
