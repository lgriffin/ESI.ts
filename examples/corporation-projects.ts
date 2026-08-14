/**
 * ESI.ts Example: Corporation Projects
 *
 * Demonstrates the Corporation Projects endpoints:
 *  - getCorporationProjects (list corporation projects)
 *  - getCorporationProject (project details)
 *  - getCorporationProjectContributors (list project contributors)
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
    const projects = await tryOrSkip('Corporation projects', () =>
      client.corporationProjects.getCorporationProjects(CORP_ID),
    );

    if (projects) {
      console.log(`  Projects found: ${projects.length}`);

      for (const project of projects.slice(0, 5)) {
        console.log(`    Project ${project.project_id} (${project.state})`);
        console.log(`      Progress: ${(project.progress * 100).toFixed(1)}%`);
        console.log(`      Started: ${project.start_time}`);
        if (project.finish_time) {
          console.log(`      Finished: ${project.finish_time}`);
        }
      }
      if (projects.length > 5) {
        console.log(`    ... and ${projects.length - 5} more`);
      }

      // --- Project Details ---
      if (projects.length > 0) {
        const firstProject = projects[0]!;
        console.log(`\n  Details for Project ${firstProject.project_id}:`);
        const detail = await tryOrSkip('Project detail', () =>
          client.corporationProjects.getCorporationProject(
            CORP_ID,
            firstProject.project_id,
          ),
        );
        if (detail) {
          console.log(`    State: ${detail.state}`);
          console.log(
            `    Progress: ${(detail.progress * 100).toFixed(1)}%`,
          );
        }

        // --- Project Contributors ---
        console.log(
          `\n  Contributors for Project ${firstProject.project_id}:`,
        );
        const contributors = await tryOrSkip('Contributors', () =>
          client.corporationProjects.getCorporationProjectContributors(
            CORP_ID,
            firstProject.project_id,
          ),
        );
        if (contributors) {
          console.log(`    Total contributors: ${contributors.length}`);
          for (const c of contributors.slice(0, 5)) {
            console.log(
              `      Character ${c.character_id}: ${c.contribution} contribution`,
            );
          }
          if (contributors.length > 5) {
            console.log(`      ... and ${contributors.length - 5} more`);
          }
        }

        // --- Character Contribution ---
        console.log(
          `\n  Character ${CHARACTER_ID} contribution to Project ${firstProject.project_id}:`,
        );
        const contribution = await tryOrSkip('Contribution', () =>
          client.corporationProjects.getCorporationProjectContribution(
            CORP_ID,
            firstProject.project_id,
            CHARACTER_ID,
          ),
        );
        if (contribution) {
          console.log(`    Contribution: ${contribution.contribution}`);
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
