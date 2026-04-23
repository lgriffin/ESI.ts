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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-skills-demo' });

  try {
    console.log('Character Skills Overview\n');

    // Fetch all skill data in parallel
    // Scopes: esi-skills.read_skills.v1, esi-skills.read_skillqueue.v1, esi-characters.read_attributes.v1
    console.log('Fetching skills, queue, and attributes...');
    const [skillsData, queue, attributes] = await Promise.all([
      client.skills.getCharacterSkills(CHARACTER_ID),
      client.skills.getCharacterSkillQueue(CHARACTER_ID),
      client.skills.getCharacterAttributes(CHARACTER_ID).catch(() => null),
    ]);

    // Trained skills summary
    console.log('Trained Skills');
    console.log('-'.repeat(40));
    console.log(`  Total skill points:      ${skillsData.total_sp.toLocaleString()}`);
    if (skillsData.unallocated_sp !== undefined) {
      console.log(`  Unallocated SP:          ${skillsData.unallocated_sp.toLocaleString()}`);
    }
    console.log(`  Skills trained:          ${skillsData.skills.length}`);

    // Group skills by level
    const byLevel: Record<number, number> = {};
    for (const skill of skillsData.skills) {
      byLevel[skill.trained_skill_level] = (byLevel[skill.trained_skill_level] || 0) + 1;
    }
    console.log('\n  Skills by level:');
    for (let lvl = 5; lvl >= 1; lvl--) {
      if (byLevel[lvl]) {
        console.log(`    Level ${lvl}: ${byLevel[lvl]} skills`);
      }
    }

    // Top skills by SP
    const topSkills = [...skillsData.skills]
      .sort((a, b) => b.skillpoints_in_skill - a.skillpoints_in_skill)
      .slice(0, 5);
    console.log('\n  Top 5 skills by SP:');
    for (const skill of topSkills) {
      console.log(`    Type ${skill.skill_id}: ${skill.skillpoints_in_skill.toLocaleString()} SP (Level ${skill.trained_skill_level})`);
    }

    // Skill queue
    console.log(`\nSkill Queue (${queue.length} entries)`);
    console.log('-'.repeat(40));
    if (queue.length === 0) {
      console.log('  Queue is empty — no skills training!');
    } else {
      const activeSkills = queue.slice(0, 5);
      for (const entry of activeSkills) {
        const status = entry.finish_date
          ? `finishes ${new Date(entry.finish_date).toLocaleString()}`
          : 'paused';
        console.log(`  #${entry.queue_position}: Type ${entry.skill_id} to Level ${entry.finished_level} (${status})`);
      }
      if (queue.length > 5) {
        console.log(`  ... and ${queue.length - 5} more in queue`);
      }
    }

    // Neural remap attributes (optional scope)
    if (attributes) {
      console.log('\nNeural Remap Attributes');
      console.log('-'.repeat(40));
      console.log(`  Intelligence: ${attributes.intelligence}`);
      console.log(`  Memory:       ${attributes.memory}`);
      console.log(`  Charisma:     ${attributes.charisma}`);
      console.log(`  Perception:   ${attributes.perception}`);
      console.log(`  Willpower:    ${attributes.willpower}`);
      if (attributes.accrued_remap_cooldown_date) {
        console.log(`  Next remap:   ${new Date(attributes.accrued_remap_cooldown_date).toLocaleDateString()}`);
      }
      if (attributes.bonus_remaps) {
        console.log(`  Bonus remaps: ${attributes.bonus_remaps}`);
      }
    } else {
      console.log('\nNeural Remap Attributes: unavailable (scope esi-characters.read_attributes.v1 not granted)');
    }

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scope esi-skills.read_skills.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
