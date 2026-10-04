/**
 * ESI.ts Example: Freelance Jobs
 *
 * Demonstrates the four Equinox freelance job endpoints:
 *  - getCharacterFreelanceJobs (character's posted/accepted jobs)
 *  - getCharacterFreelanceJobParticipation (participation in a specific job)
 *  - getCorporationFreelanceJobs (corporation's posted jobs)
 *  - getCorporationFreelanceJobParticipants (participants in a specific corp job)
 *
 * REQUIRES AUTHENTICATION with scopes:
 *  - esi-characters.read_freelance_jobs.v1
 *  - esi-corporations.read_freelance_jobs.v1
 *
 * Usage: npm run example:freelance-jobs
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

async function tryOrSkip<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (
      err instanceof EsiError &&
      [401, 403, 404].includes(err.statusCode ?? 0)
    ) {
      log.info(`  ${label}: endpoint not available — skipped`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Freelance Jobs (Equinox)\n');

    // --- Character Freelance Jobs ---
    log.info('Character Freelance Jobs');
    log.info('-'.repeat(50));
    const charJobs = await tryOrSkip('Character jobs', () =>
      client.freelanceJobs.getCharacterFreelanceJobs(CHARACTER_ID),
    );

    if (charJobs) {
      const jobs = charJobs.freelance_jobs;
      log.info(`  Jobs found: ${jobs.length}`);

      for (const job of jobs.slice(0, 5)) {
        log.info(`    ${job.name} (${job.state})`);
        log.info(
          `      Progress: ${job.progress.current}/${job.progress.desired}`,
        );
        if (job.reward) {
          log.info(
            `      Reward: ${job.reward.remaining.toLocaleString()} ISK remaining`,
          );
        }
      }
      if (jobs.length > 5) {
        log.info(`    ... and ${jobs.length - 5} more`);
      }

      // If we have jobs, try participation on the first one
      if (jobs.length > 0) {
        const firstJob = jobs[0]!;
        log.info(`\n  Participation in "${firstJob.name}":`);
        const participation = await tryOrSkip('Participation', () =>
          client.freelanceJobs.getCharacterFreelanceJobParticipation(
            CHARACTER_ID,
            firstJob.id,
          ),
        );
        if (participation) {
          log.info(`    State: ${participation.state}`);
          log.info(`    Contributed: ${participation.contributed}`);
          log.info(`    Last modified: ${participation.last_modified}`);
        }
      }
    }

    // --- Corporation Freelance Jobs ---
    log.info('\nCorporation Freelance Jobs');
    log.info('-'.repeat(50));
    const corpJobs = await tryOrSkip('Corporation jobs', () =>
      client.freelanceJobs.getCorporationFreelanceJobs(CORP_ID),
    );

    if (corpJobs) {
      const jobs = corpJobs.freelance_jobs;
      log.info(`  Jobs found: ${jobs.length}`);

      for (const job of jobs.slice(0, 5)) {
        log.info(`    ${job.name} (${job.state})`);
        log.info(
          `      Progress: ${job.progress.current}/${job.progress.desired}`,
        );
      }
      if (jobs.length > 5) {
        log.info(`    ... and ${jobs.length - 5} more`);
      }

      // If we have jobs, try participants on the first one
      if (jobs.length > 0) {
        const firstJob = jobs[0]!;
        log.info(`\n  Participants in "${firstJob.name}":`);
        const participants = await tryOrSkip('Participants', () =>
          client.freelanceJobs.getCorporationFreelanceJobParticipants(
            CORP_ID,
            firstJob.id,
          ),
        );
        if (participants) {
          const roll = participants.participants;
          log.info(`    Participants on this page: ${roll.length}`);
          for (const p of roll.slice(0, 5)) {
            log.info(
              `      ${p.name} (${p.id}): ${p.contributed} contributed (${p.state})`,
            );
          }
        }
      }
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
