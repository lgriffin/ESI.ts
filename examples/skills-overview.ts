/**
 * ESI.ts Example: Skills Overview
 *
 * Demonstrates character skill inspection including trained skills,
 * skill queue, and neural remap attributes.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-skills.read_skills.v1          (trained skills + total SP)
 *   - esi-skills.read_skillqueue.v1      (skill training queue)
 *   - esi-characters.read_attributes.v1  (neural remap attributes — optional, used in the attributes section)
 *
 * Usage: npm run example:skills
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

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-skills-demo',
  });

  try {
    log.info('Character Skills Overview\n');

    // Fetch all skill data in parallel
    // Scopes: esi-skills.read_skills.v1, esi-skills.read_skillqueue.v1, esi-characters.read_attributes.v1
    log.info('Fetching skills, queue, and attributes...');
    const [skillsData, queue, attributes] = await Promise.all([
      client.skills.getCharacterSkills(CHARACTER_ID),
      client.skills.getCharacterSkillQueue(CHARACTER_ID),
      client.skills.getCharacterAttributes(CHARACTER_ID).catch(() => null),
    ]);

    // Trained skills summary
    log.info('Trained Skills');
    log.info('-'.repeat(40));
    log.info(
      `  Total skill points:      ${skillsData.total_sp.toLocaleString()}`,
    );
    if (skillsData.unallocated_sp !== undefined) {
      log.info(
        `  Unallocated SP:          ${skillsData.unallocated_sp.toLocaleString()}`,
      );
    }
    log.info(`  Skills trained:          ${skillsData.skills.length}`);

    // Group skills by level
    const byLevel: Record<number, number> = {};
    for (const skill of skillsData.skills) {
      byLevel[skill.trained_skill_level] =
        (byLevel[skill.trained_skill_level] || 0) + 1;
    }
    log.info('\n  Skills by level:');
    for (let lvl = 5; lvl >= 1; lvl--) {
      if (byLevel[lvl]) {
        log.info(`    Level ${lvl}: ${byLevel[lvl]} skills`);
      }
    }

    // Top skills by SP
    const topSkills = [...skillsData.skills]
      .sort((a, b) => b.skillpoints_in_skill - a.skillpoints_in_skill)
      .slice(0, 5);
    log.info('\n  Top 5 skills by SP:');
    for (const skill of topSkills) {
      log.info(
        `    Type ${skill.skill_id}: ${skill.skillpoints_in_skill.toLocaleString()} SP (Level ${skill.trained_skill_level})`,
      );
    }

    // Skill queue
    log.info(`\nSkill Queue (${queue.length} entries)`);
    log.info('-'.repeat(40));
    if (queue.length === 0) {
      log.info('  Queue is empty — no skills training!');
    } else {
      const activeSkills = queue.slice(0, 5);
      for (const entry of activeSkills) {
        const status = entry.finish_date
          ? `finishes ${new Date(entry.finish_date).toLocaleString()}`
          : 'paused';
        log.info(
          `  #${entry.queue_position}: Type ${entry.skill_id} to Level ${entry.finished_level} (${status})`,
        );
      }
      if (queue.length > 5) {
        log.info(`  ... and ${queue.length - 5} more in queue`);
      }
    }

    // Neural remap attributes (optional scope)
    if (attributes) {
      log.info('\nNeural Remap Attributes');
      log.info('-'.repeat(40));
      log.info(`  Intelligence: ${attributes.intelligence}`);
      log.info(`  Memory:       ${attributes.memory}`);
      log.info(`  Charisma:     ${attributes.charisma}`);
      log.info(`  Perception:   ${attributes.perception}`);
      log.info(`  Willpower:    ${attributes.willpower}`);
      if (attributes.accrued_remap_cooldown_date) {
        log.info(
          `  Next remap:   ${new Date(attributes.accrued_remap_cooldown_date).toLocaleDateString()}`,
        );
      }
      if (attributes.bonus_remaps) {
        log.info(`  Bonus remaps: ${attributes.bonus_remaps}`);
      }
    } else {
      log.info(
        '\nNeural Remap Attributes: unavailable (scope esi-characters.read_attributes.v1 not granted)',
      );
    }
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-skills.read_skills.v1',
      );
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
