# Getting Started

Get from zero to your first ESI API call in under 5 minutes.

## Install

```bash
npm install @lgriffin/esi.ts
```

## Your First API Call

```typescript
import { EsiClient } from '@lgriffin/esi.ts';

const client = new EsiClient();

// Check server status — no auth needed
const status = await client.status.getStatus();
console.log(`${status.players} pilots online`);

// Look up a character
const char = await client.characters.getCharacterPublicInfo(1689391488);
console.log(char.name); // Character name

// Look up a solar system
const jita = await client.universe.getSystemById(30000142);
console.log(jita.name, jita.security_status); // "Jita", 0.9...

// Clean up when done
await client.shutdown();
```

That's it. The client handles caching, rate limiting, retries, and response validation automatically.

## What Just Happened?

When you called `client.status.getStatus()`, the request went through this pipeline:

1. **Rate limiter** checked the token bucket for the `status` group
2. **Request deduplicator** checked for in-flight identical requests
3. **Spec-aware cache** checked if the response is still within its TTL window
4. **ETag cache** sent a conditional GET if a cached response exists
5. **Retry strategy** would have retried on transient errors (502, 503, 504)
6. **Zod validation** validated the response shape against `ServerStatusSchema`

All of this happened transparently. You got back a typed `ServerStatus` object.

## Adding Authentication

Many ESI endpoints require an EVE SSO access token. The simplest way:

```bash
# Set the environment variable
export ESI_ACCESS_TOKEN=your-eve-sso-token
```

```typescript
const client = new EsiClient();

// Authenticated endpoints now work
const wallet = await client.wallet.getCharacterWallet(characterId);
console.log(`${wallet.toLocaleString()} ISK`);

const skills = await client.skills.getCharacterSkills(characterId);
console.log(`${skills.total_sp.toLocaleString()} SP`);

const location = await client.location.getCharacterLocation(characterId);
console.log(`In system ${location.solar_system_id}`);
```

Or pass the token directly:

```typescript
const client = new EsiClient({ accessToken: 'your-token' });
```

See the [Authentication guide](/guide/authentication) for token refresh, OAuth2 flow, and multi-character setups.

## Streaming Large Datasets

For endpoints that return thousands of results (market orders, assets, contracts), use streaming pagination to process data page-by-page without loading everything into memory:

```typescript
for await (const page of client.market.streamMarketOrders(10000002)) {
  console.log(
    `Page ${page.page}/${page.totalPages}: ${page.data.length} orders`,
  );

  for (const order of page.data) {
    if (order.is_buy_order && order.price > 1_000_000) {
      console.log(`High-value buy: ${order.type_id} @ ${order.price} ISK`);
    }
  }

  // Stop early if you've found what you need
  if (page.page >= 3) break;
}
```

## Error Handling

```typescript
import {
  EsiError,
  isNotFound,
  isRateLimited,
  isTimeout,
} from '@lgriffin/esi.ts';

try {
  const alliance = await client.alliance.getAllianceById(99999999);
} catch (err) {
  if (isNotFound(err)) {
    console.log('Alliance does not exist');
  } else if (isRateLimited(err)) {
    console.log('Rate limited — the client will retry automatically');
  } else if (isTimeout(err)) {
    console.log('Request timed out');
  } else if (err instanceof EsiError) {
    console.log(`ESI error ${err.statusCode}: ${err.message}`);
  }
}
```

Or use safe mode to get errors as values instead of exceptions:

```typescript
const safeClient = client.alliance.withSafeMode();
const result = await safeClient.getAllianceById(99999999);

if (result.ok) {
  console.log(result.data.name);
} else {
  console.log(`Error: ${result.error.message}`);
}
```

## Next Steps

| Topic                                   | Description                                                 |
| --------------------------------------- | ----------------------------------------------------------- |
| [Configuration](/guide/configuration)   | All client options — timeouts, retries, caching, validation |
| [Authentication](/guide/authentication) | EVE SSO setup, token refresh, multi-character apps          |
| [Error Handling](/guide/error-handling) | Error types, type guards, safe mode                         |
| [Caching](/guide/caching)               | Three-tier caching system and configuration                 |
| [Endpoint Explorer](/explorer/)         | Browse all 235 endpoints with code snippets                 |
| [Examples](/examples/)                  | 52 runnable example scripts                                 |
