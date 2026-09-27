# Lightweight Clients

If you only need a few APIs, ESI.ts provides two ways to create lighter clients that load only what you need.

## EsiClientBuilder

Use the fluent builder to select specific domain clients:

```typescript
import { EsiClientBuilder } from '@lgriffin/esi.ts';

const client = new EsiClientBuilder()
  .addClients(['market', 'universe', 'characters'])
  .withClientId('my-trading-bot')
  .withAccessToken('your-token')
  .withConfig({ enableCircuitBreaker: true })
  .build();

const prices = await client.market?.getMarketPrices();
const system = await client.universe?.getSystemById(30000142);
```

The returned `CustomEsiClient` has the same property accessors as `EsiClient`, but unloaded clients return `undefined`.

### Builder Methods

| Method                   | Description                      |
| ------------------------ | -------------------------------- |
| `addClient(type)`        | Add a single client by type name |
| `addClients(types[])`    | Add multiple clients             |
| `withConfig(config)`     | Set `EsiClientConfig` options    |
| `withClientId(id)`       | Set the User-Agent identifier    |
| `withAccessToken(token)` | Set the access token             |
| `build()`                | Create the `CustomEsiClient`     |

## EsiApiFactory

Create a standalone single-API client with `EsiApiFactory.createClient(type)`:

```typescript
import { EsiApiFactory, type MarketClient } from '@lgriffin/esi.ts';

const marketClient = EsiApiFactory.createClient('market', {
  clientId: 'price-checker',
}) as MarketClient;
const prices = await marketClient.getMarketPrices();
```

::: warning Deprecated in 11.0.0
The nine named factory methods below still work, and are `@deprecated`: removal is 12.0.0 at the earliest. New code should use `createEsi()` from `@lgriffin/esi.ts/client`, where `esi.public.markets.prices.get()` replaces `createMarketClient().getMarketPrices()` and `esi.as(identity)` reaches the authenticated operations. `createClient(type)` is not deprecated.
:::

### Available Factory Methods

Every method but `createClient` is deprecated since 11.0.0.

| Method                              | Returns              |
| ----------------------------------- | -------------------- |
| `createAllianceClient(config?)`     | `AllianceClient`     |
| `createCharacterClient(config?)`    | `CharacterClient`    |
| `createCorporationClient(config?)`  | `CorporationsClient` |
| `createMarketClient(config?)`       | `MarketClient`       |
| `createUniverseClient(config?)`     | `UniverseClient`     |
| `createFleetClient(config?)`        | `FleetClient`        |
| `createAssetsClient(config?)`       | `AssetsClient`       |
| `createWalletClient(config?)`       | `WalletClient`       |
| `createMailClient(config?)`         | `MailClient`         |
| `createClient(clientType, config?)` | Any domain client    |

## Middleware Parity

All three patterns (`EsiClient`, `CustomEsiClient`, `EsiApiFactory`) get identical middleware defaults: cache, request deduplication, and rate limiter. There's no functionality trade-off — only which domain clients are loaded.
