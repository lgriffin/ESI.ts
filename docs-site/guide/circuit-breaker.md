# Circuit Breaker

The circuit breaker prevents cascading failures by temporarily stopping requests to endpoints that are consistently failing.

## How It Works

```
┌────────┐     failures     ┌────────┐     timeout     ┌───────────┐
│ CLOSED │ ──────────────→ │  OPEN  │ ──────────────→ │ HALF-OPEN │
│        │ ←────────────── │        │                  │           │
└────────┘     reset        └────────┘  ←───────────── └───────────┘
                                          success/fail
```

- **Closed** — requests flow normally. Failures are counted.
- **Open** — requests immediately throw `CircuitOpenError`. No HTTP calls are made.
- **Half-Open** — a single probe request is allowed through. If it succeeds, the circuit closes. If it fails, the circuit opens again.

## Enabling the Circuit Breaker

The circuit breaker is **opt-in** (disabled by default):

```typescript
const client = new EsiClient({
  enableCircuitBreaker: true,
  circuitBreakerConfig: {
    keyStrategy: 'resolved', // 'resolved' (per-URL) or 'template' (per-route)
    cleanupIntervalMs: 300000, // stale circuit cleanup (default: 5 min)
  },
});
```

### Key Strategies

| Strategy     | Description                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'resolved'` | One circuit per resolved URL (e.g., `/characters/12345`). More granular — a failing character doesn't trip the circuit for all characters.            |
| `'template'` | One circuit per route template (e.g., `/characters/{character_id}`). Broader protection — if the endpoint itself is down, one circuit covers all IDs. |

## Handling Circuit Open Errors

```typescript
import { isCircuitOpen } from '@lgriffin/esi.ts';

try {
  await client.characters.getCharacterPublicInfo(12345);
} catch (err) {
  if (isCircuitOpen(err)) {
    console.log('Circuit breaker open — endpoint temporarily unavailable');
    // Use cached data, show a fallback, or retry later
  }
}
```

## Monitoring and Reset

```typescript
// Check circuit breaker stats
const stats = client.getCircuitBreakerStats();
for (const [endpoint, state] of Object.entries(stats)) {
  console.log(`${endpoint}: ${state.state}`); // 'closed' | 'open' | 'half-open'
}

// Reset a specific endpoint's circuit
client.resetCircuitBreaker('GET:/v1/characters/{character_id}/');

// Reset all circuits
client.resetCircuitBreaker();
```

## Interaction with Retry

The retry strategy respects the circuit breaker — requests are not retried when the circuit is open. The circuit breaker fires before the retry strategy in the pipeline.
