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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

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
      console.log(`  ${label}: endpoint not available — skipped`);
      return null;
    }
    throw err;
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Corporation Projects\n');

    // --- List Corporation Projects ---
    console.log('Corporation Projects');
    console.log('-'.repeat(50));
    const listing = await tryOrSkip('Corporation projects', () =>
      client.corporationProjects.getCorporationProjects(CORP_ID),
    );

    if (listing) {
      const projects = listing.projects;
      console.log(`  Projects on this page: ${projects.length}`);
      if (listing.cursor?.after) {
        console.log(`  Next page cursor: ${listing.cursor.after}`);
      }

      for (const project of projects.slice(0, 5)) {
        const { current, desired } = project.progress;
        console.log(`    ${project.name} [${project.id}] (${project.state})`);
        console.log(`      Progress: ${current}/${desired}`);
        console.log(`      Last modified: ${project.last_modified}`);
      }
      if (projects.length > 5) {
        console.log(`    ... and ${projects.length - 5} more`);
      }

      // --- Project Details ---
      if (projects.length > 0) {
        const firstProject = projects[0]!;
        console.log(`\n  Details for Project ${firstProject.id}:`);
        const detail = await tryOrSkip('Project detail', () =>
          client.corporationProjects.getCorporationProject(
            CORP_ID,
            firstProject.id,
          ),
        );
        if (detail) {
          console.log(`    State: ${detail.state}`);
          console.log(`    Created by: ${detail.creator.name}`);
          console.log(`    Career: ${detail.details.career}`);
        }

        // --- Project Contributors ---
        console.log(`\n  Contributors for Project ${firstProject.id}:`);
        const contributors = await tryOrSkip('Contributors', () =>
          client.corporationProjects.getCorporationProjectContributors(
            CORP_ID,
            firstProject.id,
          ),
        );
        if (contributors) {
          const roll = contributors.contributors;
          console.log(`    Contributors on this page: ${roll.length}`);
          for (const c of roll.slice(0, 5)) {
            console.log(
              `      ${c.name} (${c.id}): ${c.contributed} contributed`,
            );
          }
          if (roll.length > 5) {
            console.log(`      ... and ${roll.length - 5} more`);
          }
        }

        // --- Character Contribution ---
        console.log(
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
          console.log(`    Contributed: ${contribution.contributed}`);
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
