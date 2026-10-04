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
 *
 * @nightly auth
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

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
      log.info(`  ${label}: requires corporation roles — skipped`);
    } else if (err instanceof EsiError && err.statusCode === 404) {
      log.info(`  ${label}: endpoint not available — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Industry Jobs & Mining\n');

    // --- Character Industry Jobs ---
    log.info('Character Industry Jobs');
    log.info('-'.repeat(50));
    const jobs = await client.industry.getCharacterIndustryJobs(CHARACTER_ID);
    log.info(`  Total jobs: ${jobs.length}`);
    const active = jobs.filter((j) => j.status === 'active');
    log.info(`  Active: ${active.length}`);
    for (const job of active.slice(0, 5)) {
      log.info(
        `    Job ${job.job_id}: type ${job.blueprint_type_id}, activity ${job.activity_id}, ends ${job.end_date}`,
      );
    }
    if (active.length > 5) log.info(`    ... and ${active.length - 5} more`);

    // --- Character Mining Ledger ---
    log.info('\nMining Ledger');
    log.info('-'.repeat(50));
    const ledger = await client.industry.getCharacterMiningLedger(CHARACTER_ID);
    log.info(`  Entries: ${ledger.length}`);
    for (const entry of ledger.slice(0, 5)) {
      log.info(
        `    ${entry.date}: type ${entry.type_id}, ${entry.quantity} units in system ${entry.solar_system_id}`,
      );
    }
    if (ledger.length > 5) log.info(`    ... and ${ledger.length - 5} more`);

    // --- Corporation Industry Jobs (may 403) ---
    log.info('\nCorporation Industry Jobs');
    log.info('-'.repeat(50));
    await tryOrSkip('Corp industry jobs', async () => {
      const corpJobs =
        await client.industry.getCorporationIndustryJobs(CORP_ID);
      log.info(`  Total corp jobs: ${corpJobs.length}`);
    });

    // --- Moon Extraction Timers (may 403) ---
    log.info('\nMoon Extraction Timers');
    log.info('-'.repeat(50));
    await tryOrSkip('Moon extractions', async () => {
      const timers = await client.industry.getMoonExtractionTimers(CORP_ID);
      log.info(`  Active extractions: ${timers.length}`);
    });

    // --- Corporation Mining Observers (may 403) ---
    log.info('\nMining Observers');
    log.info('-'.repeat(50));
    await tryOrSkip('Mining observers', async () => {
      const observers =
        await client.industry.getCorporationMiningObservers(CORP_ID);
      log.info(`  Observers: ${observers.length}`);
      if (observers.length > 0) {
        const first = observers[0]!;
        const entries = await client.industry.getCorporationMiningObserver(
          CORP_ID,
          first.observer_id,
        );
        log.info(`  Observer ${first.observer_id}: ${entries.length} entries`);
      }
    });

    // --- Corporation Killmails (may 403) ---
    log.info('\nCorporation Killmails');
    log.info('-'.repeat(50));
    await tryOrSkip('Corp killmails', async () => {
      const killmails =
        await client.killmails.getCorporationRecentKillmails(CORP_ID);
      log.info(`  Recent killmails: ${killmails.length}`);
    });
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error('Authentication required. Set ESI_ACCESS_TOKEN.');
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
