/**
 * ESI.ts Example: Industry Jobs & Mining
 *
 * Demonstrates character industry jobs, mining ledger, corporation
 * industry jobs, moon extraction timers, mining observers, and
 * corporation killmails.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:industry-mining
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;

async function tryOrSkip(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 403 || err.statusCode === 401)
    ) {
      console.log(`  ${label}: requires corporation roles — skipped`);
    } else if (err instanceof EsiError && err.statusCode === 404) {
      console.log(`  ${label}: endpoint not available — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Industry Jobs & Mining\n');

    // --- Character Industry Jobs ---
    console.log('Character Industry Jobs');
    console.log('-'.repeat(50));
    const jobs = await client.industry.getCharacterIndustryJobs(CHARACTER_ID);
    console.log(`  Total jobs: ${jobs.length}`);
    const active = jobs.filter((j) => j.status === 'active');
    console.log(`  Active: ${active.length}`);
    for (const job of active.slice(0, 5)) {
      console.log(
        `    Job ${job.job_id}: type ${job.blueprint_type_id}, activity ${job.activity_id}, ends ${job.end_date}`,
      );
    }
    if (active.length > 5) console.log(`    ... and ${active.length - 5} more`);

    // --- Character Mining Ledger ---
    console.log('\nMining Ledger');
    console.log('-'.repeat(50));
    const ledger = await client.industry.getCharacterMiningLedger(CHARACTER_ID);
    console.log(`  Entries: ${ledger.length}`);
    for (const entry of ledger.slice(0, 5)) {
      console.log(
        `    ${entry.date}: type ${entry.type_id}, ${entry.quantity} units in system ${entry.solar_system_id}`,
      );
    }
    if (ledger.length > 5) console.log(`    ... and ${ledger.length - 5} more`);

    // --- Corporation Industry Jobs (may 403) ---
    console.log('\nCorporation Industry Jobs');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp industry jobs', async () => {
      const corpJobs =
        await client.industry.getCorporationIndustryJobs(CORP_ID);
      console.log(`  Total corp jobs: ${corpJobs.length}`);
    });

    // --- Moon Extraction Timers (may 403) ---
    console.log('\nMoon Extraction Timers');
    console.log('-'.repeat(50));
    await tryOrSkip('Moon extractions', async () => {
      const timers = await client.industry.getMoonExtractionTimers(CORP_ID);
      console.log(`  Active extractions: ${timers.length}`);
    });

    // --- Corporation Mining Observers (may 403) ---
    console.log('\nMining Observers');
    console.log('-'.repeat(50));
    await tryOrSkip('Mining observers', async () => {
      const observers =
        await client.industry.getCorporationMiningObservers(CORP_ID);
      console.log(`  Observers: ${observers.length}`);
      if (observers.length > 0) {
        const first = observers[0]!;
        const entries = await client.industry.getCorporationMiningObserver(
          CORP_ID,
          first.observer_id,
        );
        console.log(
          `  Observer ${first.observer_id}: ${entries.length} entries`,
        );
      }
    });

    // --- Corporation Killmails (may 403) ---
    console.log('\nCorporation Killmails');
    console.log('-'.repeat(50));
    await tryOrSkip('Corp killmails', async () => {
      const killmails =
        await client.killmails.getCorporationRecentKillmails(CORP_ID);
      console.log(`  Recent killmails: ${killmails.length}`);
    });
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN.');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
