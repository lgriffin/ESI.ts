/**
 * Cursor-based Pagination Example
 *
 * ESI uses cursor-based pagination for newer routes like Freelance Jobs.
 * Instead of page numbers and x-pages headers, the API returns opaque
 * `before` and `after` cursor tokens in the response body.
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

import { EsiClient, FreelanceJobsListing, fetchAllCursorPages } from '../src';

// ─── Example 1: Fetch the public freelance jobs listing ──────────────────────
async function fetchFirstPage() {
    console.log('=== Fetch First Page of Freelance Jobs ===\n');

    const client = new EsiClient();

    try {
        const result: FreelanceJobsListing = await client.freelanceJobs.getFreelanceJobs();

        console.log(`  Fetched ${result.freelance_jobs.length} jobs`);
        console.log(`  Cursor before: ${result.cursor.before}`);
        console.log(`  Cursor after:  ${result.cursor.after}`);
        console.log();

        for (const job of result.freelance_jobs.slice(0, 3)) {
            const pct = ((job.progress.current / job.progress.desired) * 100).toFixed(1);
            console.log(`  ${job.name}`);
            console.log(`    State: ${job.state} | Progress: ${pct}%`);
            if (job.reward) {
                console.log(`    Reward: ${(job.reward.remaining / 1_000_000).toFixed(0)}M ISK remaining`);
            }
        }
        if (result.freelance_jobs.length > 3) {
            console.log(`  ... and ${result.freelance_jobs.length - 3} more`);
        }
    } finally {
        await client.shutdown();
    }
    console.log();
}

// ─── Example 2: Manual cursor pagination ─────────────────────────────────────
async function manualCursorPagination() {
    console.log('=== Manual Cursor Pagination ===\n');

    const client = new EsiClient();
    let totalJobs = 0;
    let pageCount = 0;
    let afterToken: string | undefined;

    try {
        while (pageCount < 3) { // limit to 3 pages for the demo
            const result = await client.freelanceJobs.getFreelanceJobs(undefined, afterToken);
            pageCount++;

            console.log(`  Page ${pageCount}: ${result.freelance_jobs.length} jobs`);

            if (result.freelance_jobs.length === 0) {
                console.log('  End of dataset reached.');
                break;
            }

            totalJobs += result.freelance_jobs.length;

            if (!result.cursor.after) {
                console.log('  No more pages.');
                break;
            }

            afterToken = result.cursor.after;
        }

        console.log(`\n  Total jobs fetched: ${totalJobs} across ${pageCount} pages`);
    } finally {
        await client.shutdown();
    }
    console.log();
}

// ─── Example 3: Auto-fetch all with fetchAllCursorPages ──────────────────────
async function autoFetchAll() {
    console.log('=== Auto-fetch All Freelance Jobs ===\n');

    const client = new EsiClient();

    try {
        const allJobs = await fetchAllCursorPages(
            (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
            (response) => response.freelance_jobs,
            (response) => response.cursor,
        );

        console.log(`  Fetched ${allJobs.length} total freelance jobs`);

        // Show some stats
        const active = allJobs.filter(j => j.state === 'Active').length;
        console.log(`  Active: ${active}`);
    } finally {
        await client.shutdown();
    }
    console.log();
}

// ─── Example 4: Fetch a specific job's details ───────────────────────────────
async function fetchJobDetail() {
    console.log('=== Fetch Job Detail ===\n');

    const client = new EsiClient();

    try {
        // First get a job ID from the listing
        const listing = await client.freelanceJobs.getFreelanceJobs();
        if (listing.freelance_jobs.length === 0) {
            console.log('  No jobs found.');
            return;
        }

        const jobId = listing.freelance_jobs[0].id;
        const detail = await client.freelanceJobs.getFreelanceJobById(jobId);

        console.log(`  Job: ${detail.name}`);
        console.log(`  Career: ${detail.details.career}`);
        console.log(`  Creator: ${detail.details.creator.character.name}`);
        console.log(`  Corporation: ${detail.details.creator.corporation.name}`);
        console.log(`  Method: ${detail.configuration.method}`);
        console.log(`  Expires: ${detail.details.expires}`);
        console.log(`  Max participants: ${detail.contribution.max_committed_participants}`);
        if (detail.access_and_visibility.broadcast_locations.length > 0) {
            const locations = detail.access_and_visibility.broadcast_locations
                .map(l => l.name).join(', ');
            console.log(`  Broadcast locations: ${locations}`);
        }
    } finally {
        await client.shutdown();
    }
    console.log();
}

// ─── Example 5: Polling for changes ──────────────────────────────────────────
async function pollingPattern() {
    console.log('=== Polling Pattern (Incremental Updates) ===\n');

    console.log(`  // After initial scan, save the final cursor token:
  let savedCursor = lastPage.cursor.after;

  // Later: check for updates (hours, days, or weeks later)
  const updates = await client.freelanceJobs.getFreelanceJobs(undefined, savedCursor);
  if (updates.freelance_jobs.length > 0) {
      // Process changed records — duplicates are expected for modified records
      savedCursor = updates.cursor.after;
  }

  // Character/Corporation endpoints require auth (ESI_ACCESS_TOKEN):
  // const myJobs = await client.freelanceJobs.getCharacterFreelanceJobs(charId);
  // const corpJobs = await client.freelanceJobs.getCorporationFreelanceJobs(corpId);
`);
}

// ─── Run all examples ────────────────────────────────────────────────────────
async function main() {
    console.log('Freelance Jobs & Cursor Pagination Examples\n');
    console.log('These examples use the live ESI Freelance Jobs endpoints.');
    console.log('Public endpoints (no auth needed): listing + detail');
    console.log('Character/Corporation endpoints require ESI_ACCESS_TOKEN.\n');

    await fetchFirstPage();
    await manualCursorPagination();
    await autoFetchAll();
    await fetchJobDetail();
    await pollingPattern();

    console.log('Done!');
}

if (require.main === module) {
    main();
}
