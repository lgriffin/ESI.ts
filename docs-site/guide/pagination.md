# Pagination & Streaming

ESI.ts supports three pagination strategies: automatic offset pagination, cursor-based pagination (newer endpoints), and streaming via `AsyncGenerator`.

## Streaming Pagination

For large datasets, streaming yields one page at a time without loading everything into memory:

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

  // Stop early if needed — remaining pages are not fetched
  if (page.page >= 3) break;
}
```

21 domain clients expose 73+ streaming methods. Some highlights:

| Client           | Methods                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **Market**       | `streamMarketOrders`, `streamMarketTypes`, `streamCharacterOrderHistory`, `streamCorporationOrders`   |
| **Corporations** | `streamCorporationMembers`, `streamCorporationStructures`, `streamCorporationBlueprints` + 14 more    |
| **Characters**   | `streamCharacterBlueprints`, `streamCharacterNotifications`, `streamCharacterStandings` + 5 more      |
| **Contracts**    | `streamPublicContracts`, `streamCharacterContracts`, `streamCorporationContracts`                     |
| **Wallet**       | `streamCharacterWalletJournal`, `streamCorporationWalletJournal`, `streamCharacterWalletTransactions` |
| **Assets**       | `streamCharacterAssets`, `streamCorporationAssets`                                                    |
| **Industry**     | `streamCorporationIndustryJobs`, `streamCorporationMiningObservers` + 6 more                          |

The generic `streamEndpoint()` method on `BaseEsiClient` is also public as an escape hatch for any paginated endpoint.

## Cursor-Based Pagination

Newer ESI routes (Freelance Jobs, and future routes) use cursor-based pagination with opaque `before`/`after` tokens:

```typescript
import { fetchAllCursorPages } from '@lgriffin/esi.ts';

// Fetch first page
const page = await client.freelanceJobs.getFreelanceJobs();
console.log(page.freelance_jobs);
console.log(page.cursor.after); // opaque token for next page

// Fetch next page using cursor
const nextPage = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  page.cursor.after,
);

// Or auto-fetch all pages
const allJobs = await fetchAllCursorPages(
  (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
  (response) => response.freelance_jobs,
  (response) => response.cursor,
);
```

### Polling for Changes

Cursor tokens persist across sessions. Save the last `after` token and poll later for only new/changed records:

```typescript
let savedCursor = lastPage.cursor.after;

// Later: check for updates
const updates = await client.freelanceJobs.getFreelanceJobs(
  undefined,
  savedCursor,
);
if (updates.freelance_jobs.length > 0) {
  savedCursor = updates.cursor.after;
}
```

### Key Points

- Cursor tokens are **opaque strings** — never parse them
- An **empty result array** signals end of dataset (not a short page)
- **Duplicates across pages** are expected when records are modified between requests
- Existing offset-based routes are unchanged

## Helper Functions

```typescript
import { fetchAllCursorPages } from '@lgriffin/esi.ts';

// Streaming — the recommended way to handle offset-based pagination
const allOrders = [];
for await (const page of client.market.streamMarketOrders(10000002)) {
  allOrders.push(...page.data);
}
```
