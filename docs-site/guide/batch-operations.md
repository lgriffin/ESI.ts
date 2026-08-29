# Batch Operations

ESI.ts provides two batch utilities for working with multiple IDs or large payloads.

## batch() — Bounded Concurrent GETs

Fetch data for multiple IDs with controlled concurrency:

```typescript
const client = new EsiClient();

// Fetch 500 type details, at most 10 concurrent requests
const result = await client.batch(
  typeIds,
  (id) => client.universe.getTypeById(id),
  {
    concurrency: 10,
    onProgress: (done, total) => console.log(`${done}/${total}`),
  },
);

// result.results: Map<number, T> — successful responses
// result.errors: Map<number, Error> — failed requests
console.log(`${result.results.size} succeeded, ${result.errors.size} failed`);
```

### Options

| Option        | Type                    | Default | Description                 |
| ------------- | ----------------------- | ------- | --------------------------- |
| `concurrency` | `number`                | `10`    | Maximum concurrent requests |
| `onProgress`  | `(done, total) => void` | —       | Progress callback           |

## batchPost() — Auto-Chunked POSTs

For POST endpoints that accept arrays (e.g., `postUniverseNames` with a 1000-ID limit), `batchPost` auto-chunks and concatenates:

```typescript
const allNames = await client.batchPost(
  largeIdArray,
  (chunk) => client.universe.postUniverseNames(chunk),
  1000, // chunk size
);
```

The results from all chunks are concatenated into a single array.

## Use Cases

### Bulk Name Resolution

```typescript
const characterIds = [1689391488, 95465499, 93734867];
const names = await client.batchPost(
  characterIds,
  (chunk) => client.universe.postUniverseNames(chunk),
  1000,
);
for (const n of names) {
  console.log(`${n.id}: ${n.name} (${n.category})`);
}
```

### Bulk Market Data

```typescript
const typeIds = [34, 35, 36, 37, 38, 39, 40]; // Minerals
const result = await client.batch(
  typeIds,
  (id) => client.market.getMarketHistory(10000002, id),
  { concurrency: 5 },
);
for (const [typeId, history] of result.results) {
  const latest = history[history.length - 1];
  console.log(`Type ${typeId}: ${latest.average} ISK avg`);
}
```
