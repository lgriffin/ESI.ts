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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

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
      console.log(`  ${label}: endpoint not available — skipped`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Freelance Jobs (Equinox)\n');

    // --- Character Freelance Jobs ---
    console.log('Character Freelance Jobs');
    console.log('-'.repeat(50));
    const charJobs = await tryOrSkip('Character jobs', () =>
      client.freelanceJobs.getCharacterFreelanceJobs(CHARACTER_ID),
    );

    if (charJobs) {
      const jobs = charJobs.freelance_jobs;
      console.log(`  Jobs found: ${jobs.length}`);

      for (const job of jobs.slice(0, 5)) {
        console.log(`    ${job.name} (${job.state})`);
        console.log(
          `      Progress: ${job.progress.current}/${job.progress.desired}`,
        );
        if (job.reward) {
          console.log(
            `      Reward: ${job.reward.remaining.toLocaleString()} ISK remaining`,
          );
        }
      }
      if (jobs.length > 5) {
        console.log(`    ... and ${jobs.length - 5} more`);
      }

      // If we have jobs, try participation on the first one
      if (jobs.length > 0) {
        const firstJob = jobs[0]!;
        console.log(`\n  Participation in "${firstJob.name}":`);
        const participation = await tryOrSkip('Participation', () =>
          client.freelanceJobs.getCharacterFreelanceJobParticipation(
            CHARACTER_ID,
            firstJob.id,
          ),
        );
        if (participation) {
          console.log(`    Status: ${participation.status}`);
          console.log(`    Contributions: ${participation.contributions}`);
          if (participation.last_contribution) {
            console.log(
              `    Last contribution: ${participation.last_contribution}`,
            );
          }
        }
      }
    }

    // --- Corporation Freelance Jobs ---
    console.log('\nCorporation Freelance Jobs');
    console.log('-'.repeat(50));
    const corpJobs = await tryOrSkip('Corporation jobs', () =>
      client.freelanceJobs.getCorporationFreelanceJobs(CORP_ID),
    );

    if (corpJobs) {
      const jobs = corpJobs.freelance_jobs;
      console.log(`  Jobs found: ${jobs.length}`);

      for (const job of jobs.slice(0, 5)) {
        console.log(`    ${job.name} (${job.state})`);
        console.log(
          `      Progress: ${job.progress.current}/${job.progress.desired}`,
        );
      }
      if (jobs.length > 5) {
        console.log(`    ... and ${jobs.length - 5} more`);
      }

      // If we have jobs, try participants on the first one
      if (jobs.length > 0) {
        const firstJob = jobs[0]!;
        console.log(`\n  Participants in "${firstJob.name}":`);
        const participants = await tryOrSkip('Participants', () =>
          client.freelanceJobs.getCorporationFreelanceJobParticipants(
            CORP_ID,
            firstJob.id,
          ),
        );
        if (participants) {
          console.log(`    Total participants: ${participants.length}`);
          for (const p of participants.slice(0, 5)) {
            console.log(
              `      Character ${p.character_id}: ${p.contributions} contributions (${p.status})`,
            );
          }
        }
      }
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
