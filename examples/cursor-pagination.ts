/**
 * Cursor-based Pagination Example
 *
 * ESI is moving new routes to cursor-based pagination (starting with Corporation
 * Projects).  Instead of page numbers and x-pages headers, the API returns opaque
 * `before` and `after` cursor tokens that let you walk through a dataset
 * incrementally.
 *
 * Key concepts:
 *   - Tokens are opaque strings — never parse or validate them.
 *   - An empty result array signals the beginning/end of the dataset.
 *   - Results are sorted by "last modified", so the `after` token lets you
 *     poll for changes efficiently.
 *   - Duplicates across pages are expected when records are modified between
 *     requests.
 *
 * See: https://developers.eveonline.com/blog/changing-pagination-turning-a-new-page
 */

import { CursorResult, CursorOptions, fetchAllCursorPages } from '../src';

// ─── Simulated cursor endpoint ───────────────────────────────────────────────
// Since Corporation Projects isn't in ESI yet, this example simulates the
// pattern so you can see the API shape your code will use.

/** Simulates a cursor-paginated ESI response */
function simulateCursorEndpoint(cursor?: CursorOptions): CursorResult<{ id: number; name: string }> {
    const dataset = [
        { id: 1, name: 'Project Alpha' },
        { id: 2, name: 'Project Beta' },
        { id: 3, name: 'Project Gamma' },
        { id: 4, name: 'Project Delta' },
        { id: 5, name: 'Project Epsilon' },
    ];

    const pageSize = 2;

    if (!cursor?.after) {
        // First page
        return {
            data: dataset.slice(0, pageSize),
            cursors: { before: null, after: 'cursor-after-2' },
        };
    }

    if (cursor.after === 'cursor-after-2') {
        return {
            data: dataset.slice(2, 4),
            cursors: { before: 'cursor-before-3', after: 'cursor-after-4' },
        };
    }

    if (cursor.after === 'cursor-after-4') {
        return {
            data: dataset.slice(4),
            cursors: { before: 'cursor-before-5', after: 'cursor-after-5' },
        };
    }

    // End of dataset
    return {
        data: [],
        cursors: { before: 'cursor-before-end', after: null },
    };
}

// ─── Example 1: Manual cursor control ────────────────────────────────────────
async function manualCursorPagination() {
    console.log('=== Manual Cursor Pagination ===\n');

    const allItems: { id: number; name: string }[] = [];
    let cursor: CursorOptions | undefined;

    while (true) {
        const result = simulateCursorEndpoint(cursor);

        console.log(`  Fetched ${result.data.length} items`);
        console.log(`    Cursors: before=${result.cursors.before}, after=${result.cursors.after}`);

        if (result.data.length === 0) {
            console.log('  End of dataset reached.\n');
            break;
        }

        allItems.push(...result.data);
        cursor = { after: result.cursors.after! };
    }

    console.log(`Total items: ${allItems.length}`);
    allItems.forEach(item => console.log(`  ${item.id}: ${item.name}`));
    console.log();
}

// ─── Example 2: Using fetchAllCursorPages helper ─────────────────────────────
async function autoFetchAll() {
    console.log('=== Auto-fetch All Pages ===\n');

    // fetchAllCursorPages takes a function that returns CursorResult
    // and automatically follows `after` tokens until the dataset is exhausted.
    const allItems = await fetchAllCursorPages((cursor) =>
        Promise.resolve(simulateCursorEndpoint(cursor))
    );

    console.log(`Fetched ${allItems.length} items in one call:`);
    allItems.forEach(item => console.log(`  ${item.id}: ${item.name}`));
    console.log();
}

// ─── Example 3: Incremental updates (polling pattern) ────────────────────────
async function incrementalUpdates() {
    console.log('=== Incremental Updates (Polling) ===\n');

    // Initial full scan
    console.log('Step 1: Initial scan...');
    let lastAfterToken: string | null = null;

    let cursor: CursorOptions | undefined;
    while (true) {
        const result = simulateCursorEndpoint(cursor);
        if (result.data.length === 0) {
            lastAfterToken = result.cursors.before; // save for polling
            break;
        }
        cursor = { after: result.cursors.after! };
        lastAfterToken = result.cursors.after;
    }

    console.log(`  Scan complete. Saved cursor: ${lastAfterToken}`);

    // Later: poll for changes using the saved token
    console.log('\nStep 2: Polling for changes...');
    console.log('  (In a real app, you would call this periodically)');

    // With a real ESI endpoint:
    //   const updates = await corpClient.getProjects(corpId, { after: lastAfterToken });
    //   if (updates.data.length > 0) {
    //       // Process changed records (may include duplicates of modified records)
    //       updates.data.forEach(record => mergeOrUpdate(localCache, record));
    //       lastAfterToken = updates.cursors.after;
    //   }

    console.log('  No changes detected (simulated).\n');
}

// ─── Example 4: What real ESI usage will look like ───────────────────────────
async function realWorldUsage() {
    console.log('=== Real-World ESI Usage (Preview) ===\n');

    console.log('When Corporation Projects launches, usage will look like:\n');

    console.log(`  // Single page with cursor control
  const page = await corpClient.getProjects(corporationId);
  // page.data     → project records
  // page.cursors  → { before: '...', after: '...' }

  // Next page
  const next = await corpClient.getProjects(corporationId, {
      after: page.cursors.after
  });

  // Fetch everything at once
  const allProjects = await fetchAllCursorPages(
      (cursor) => corpClient.getProjects(corporationId, cursor)
  );

  // Poll for changes (reuse a saved cursor token)
  const changes = await corpClient.getProjects(corporationId, {
      after: savedCursorToken
  });
`);
}

// ─── Run all examples ────────────────────────────────────────────────────────
async function main() {
    console.log('Cursor-based Pagination Examples\n');
    console.log('ESI is transitioning new routes from offset-based (page=N, x-pages)');
    console.log('to cursor-based (before/after tokens) pagination.\n');

    await manualCursorPagination();
    await autoFetchAll();
    await incrementalUpdates();
    await realWorldUsage();

    console.log('Done!');
}

if (require.main === module) {
    main();
}
