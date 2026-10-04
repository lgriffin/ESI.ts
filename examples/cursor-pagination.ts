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
 *
 * @nightly mixed
 */

import {
  createConsoleLogger,
  EsiClient,
  FreelanceJobsListing,
  fetchAllCursorPages,
} from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

// ─── Example 1: Fetch the public freelance jobs listing ──────────────────────
async function fetchFirstPage() {
  log.info('=== Fetch First Page of Freelance Jobs ===\n');

  const client = new EsiClient({ logger: esiLog });

  try {
    const result: FreelanceJobsListing =
      await client.freelanceJobs.getFreelanceJobs();

    log.info(`  Fetched ${result.freelance_jobs.length} jobs`);
    log.info(`  Cursor before: ${result.cursor?.before}`);
    log.info(`  Cursor after:  ${result.cursor?.after}`);
    log.info('');

    for (const job of result.freelance_jobs.slice(0, 3)) {
      const pct = ((job.progress.current / job.progress.desired) * 100).toFixed(
        1,
      );
      log.info(`  ${job.name}`);
      log.info(`    State: ${job.state} | Progress: ${pct}%`);
      if (job.reward) {
        log.info(
          `    Reward: ${(job.reward.remaining / 1_000_000).toFixed(0)}M ISK remaining`,
        );
      }
    }
    if (result.freelance_jobs.length > 3) {
      log.info(`  ... and ${result.freelance_jobs.length - 3} more`);
    }
  } finally {
    await client.shutdown();
  }
  log.info('');
}

// ─── Example 2: Manual cursor pagination ─────────────────────────────────────
async function manualCursorPagination() {
  log.info('=== Manual Cursor Pagination ===\n');

  const client = new EsiClient({ logger: esiLog });
  let totalJobs = 0;
  let pageCount = 0;
  let afterToken: string | undefined;

  try {
    while (pageCount < 3) {
      // limit to 3 pages for the demo
      const result = await client.freelanceJobs.getFreelanceJobs(
        undefined,
        afterToken,
      );
      pageCount++;

      log.info(`  Page ${pageCount}: ${result.freelance_jobs.length} jobs`);

      if (result.freelance_jobs.length === 0) {
        log.info('  End of dataset reached.');
        break;
      }

      totalJobs += result.freelance_jobs.length;

      if (!result.cursor?.after) {
        log.info('  No more pages.');
        break;
      }

      afterToken = result.cursor?.after ?? undefined;
    }

    log.info(`\n  Total jobs fetched: ${totalJobs} across ${pageCount} pages`);
  } finally {
    await client.shutdown();
  }
  log.info('');
}

// ─── Example 3: Auto-fetch all with fetchAllCursorPages ──────────────────────
async function autoFetchAll() {
  log.info('=== Auto-fetch All Freelance Jobs ===\n');

  const client = new EsiClient({ logger: esiLog });

  try {
    const allJobs = await fetchAllCursorPages(
      (before, after) => client.freelanceJobs.getFreelanceJobs(before, after),
      (response) => response.freelance_jobs,
      (response) => response.cursor ?? {},
    );

    log.info(`  Fetched ${allJobs.length} total freelance jobs`);

    // Show some stats
    const active = allJobs.filter((j) => j.state === 'Active').length;
    log.info(`  Active: ${active}`);
  } finally {
    await client.shutdown();
  }
  log.info('');
}

// ─── Example 4: Fetch a specific job's details ───────────────────────────────
async function fetchJobDetail() {
  log.info('=== Fetch Job Detail ===\n');

  const client = new EsiClient({ logger: esiLog });

  try {
    // First get a job ID from the listing
    const listing = await client.freelanceJobs.getFreelanceJobs();
    if (listing.freelance_jobs.length === 0) {
      log.info('  No jobs found.');
      return;
    }

    const jobId = listing.freelance_jobs[0]!.id;
    const detail = await client.freelanceJobs.getFreelanceJobById(jobId);

    log.info(`  Job: ${detail.name}`);
    log.info(`  Career: ${detail.details.career}`);
    log.info(`  Creator: ${detail.details.creator.character.name}`);
    log.info(`  Corporation: ${detail.details.creator.corporation.name}`);
    log.info(`  Method: ${detail.configuration.method}`);
    log.info(`  Expires: ${detail.details.expires ?? 'no expiry'}`);
    if (detail.contribution) {
      log.info(
        `  Max participants: ${detail.contribution.max_committed_participants}`,
      );
    }
    const broadcast = detail.access_and_visibility.broadcast_locations ?? [];
    if (broadcast.length > 0) {
      const locations = broadcast.map((l) => l.name).join(', ');
      log.info(`  Broadcast locations: ${locations}`);
    }
  } finally {
    await client.shutdown();
  }
  log.info('');
}

// ─── Example 5: Polling for changes ──────────────────────────────────────────
async function pollingPattern() {
  log.info('=== Polling Pattern (Incremental Updates) ===\n');

  log.info(`  // After initial scan, save the final cursor token:
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
  log.info('Freelance Jobs & Cursor Pagination Examples\n');
  log.info('These examples use the live ESI Freelance Jobs endpoints.');
  log.info('Public endpoints (no auth needed): listing + detail');
  log.info('Character/Corporation endpoints require ESI_ACCESS_TOKEN.\n');

  await fetchFirstPage();
  await manualCursorPagination();
  await autoFetchAll();
  await fetchJobDetail();
  await pollingPattern();

  log.info('Done!');
}

if (require.main === module) {
  main();
}
