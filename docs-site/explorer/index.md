# Endpoint Explorer

Browse all ESI.ts endpoints with code snippets. Click any endpoint to expand its usage example, then copy the snippet.

<EndpointExplorer />

## Usage Pattern

Every endpoint follows the same pattern:

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Access domain client via property
const result = await client.{domain}.{method}(args);

// With metadata
const { data, meta } = await client.{domain}.withMetadata().{method}(args);

// With safe mode (errors as values)
const result = await client.{domain}.withSafeMode().{method}(args);
```

## Client Creation Options

```typescript
// Full client — all 36 domain clients
const client = new EsiClient({ accessToken: 'token' });

// Selective client — only what you need
import { EsiClientBuilder } from '@lgriffin/esi.ts';
const client = new EsiClientBuilder()
  .addClients(['market', 'universe'])
  .build();

// Single client — standalone
import { EsiApiFactory } from '@lgriffin/esi.ts';
const market = EsiApiFactory.createMarketClient();
```

## Endpoint Coverage

The explorer above showcases the most commonly used endpoints from the library's 235 endpoint definitions. Browse by client, filter by auth requirement, or search for specific methods. For the complete list, see the [Domain Clients](/reference/clients) reference.
