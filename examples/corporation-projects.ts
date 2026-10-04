/**
 * ESI.ts Example: Corporation Projects
 *
 * Demonstrates the Corporation Projects endpoints:
 *  - getCorporationProjects (one cursor-paginated page of projects)
 *  - getCorporationProject (project details)
 *  - getCorporationProjectContributors (one page of project contributors)
 *  - getCorporationProjectContribution (character's contribution)
 *
 * REQUIRES AUTHENTICATION with corporation project scopes.
 *
 * Usage: npm run example:corporation-projects
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

const CORP_ID = 98135622;
const CHARACTER_ID = 90439768;

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
    log.info('Corporation Projects\n');

    // --- List Corporation Projects ---
    log.info('Corporation Projects');
    log.info('-'.repeat(50));
    const listing = await tryOrSkip('Corporation projects', () =>
      client.corporationProjects.getCorporationProjects(CORP_ID),
    );

    if (listing) {
      const projects = listing.projects;
      log.info(`  Projects on this page: ${projects.length}`);
      if (listing.cursor?.after) {
        log.info(`  Next page cursor: ${listing.cursor.after}`);
      }

      for (const project of projects.slice(0, 5)) {
        const { current, desired } = project.progress;
        log.info(`    ${project.name} [${project.id}] (${project.state})`);
        log.info(`      Progress: ${current}/${desired}`);
        log.info(`      Last modified: ${project.last_modified}`);
      }
      if (projects.length > 5) {
        log.info(`    ... and ${projects.length - 5} more`);
      }

      // --- Project Details ---
      if (projects.length > 0) {
        const firstProject = projects[0]!;
        log.info(`\n  Details for Project ${firstProject.id}:`);
        const detail = await tryOrSkip('Project detail', () =>
          client.corporationProjects.getCorporationProject(
            CORP_ID,
            firstProject.id,
          ),
        );
        if (detail) {
          log.info(`    State: ${detail.state}`);
          log.info(`    Created by: ${detail.creator.name}`);
          log.info(`    Career: ${detail.details.career}`);
        }

        // --- Project Contributors ---
        log.info(`\n  Contributors for Project ${firstProject.id}:`);
        const contributors = await tryOrSkip('Contributors', () =>
          client.corporationProjects.getCorporationProjectContributors(
            CORP_ID,
            firstProject.id,
          ),
        );
        if (contributors) {
          const roll = contributors.contributors;
          log.info(`    Contributors on this page: ${roll.length}`);
          for (const c of roll.slice(0, 5)) {
            log.info(`      ${c.name} (${c.id}): ${c.contributed} contributed`);
          }
          if (roll.length > 5) {
            log.info(`      ... and ${roll.length - 5} more`);
          }
        }

        // --- Character Contribution ---
        log.info(
          `\n  Character ${CHARACTER_ID} contribution to Project ${firstProject.id}:`,
        );
        const contribution = await tryOrSkip('Contribution', () =>
          client.corporationProjects.getCorporationProjectContribution(
            CORP_ID,
            firstProject.id,
            CHARACTER_ID,
          ),
        );
        if (contribution) {
          log.info(`    Contributed: ${contribution.contributed}`);
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
