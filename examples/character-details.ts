/**
 * ESI.ts Example: Character Details
 *
 * Demonstrates character-specific endpoints: agents research, blueprints,
 * roles, standings, titles, contact notifications, corporation history,
 * jump fatigue, medals, and notifications.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:character-details
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

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Character Details\n');

    log.info('Fetching character data...');
    const [
      research,
      blueprints,
      roles,
      standings,
      titles,
      contactNotifications,
      corpHistory,
      fatigue,
      medals,
      notifications,
    ] = await Promise.all([
      client.characters.getCharacterAgentsResearch(CHARACTER_ID),
      client.characters.getCharacterBlueprints(CHARACTER_ID),
      client.characters.getCharacterRoles(CHARACTER_ID),
      client.characters.getCharacterStandings(CHARACTER_ID),
      client.characters.getCharacterTitles(CHARACTER_ID),
      client.characters.getCharacterNotificationsContacts(CHARACTER_ID),
      client.characters.getCharacterCorporationHistory(CHARACTER_ID),
      client.characters.getCharacterFatigue(CHARACTER_ID),
      client.characters.getCharacterMedals(CHARACTER_ID),
      client.characters.getCharacterNotifications(CHARACTER_ID),
    ]);

    // Agent Research
    log.info('Agent Research');
    log.info('-'.repeat(50));
    log.info(`  Active research agents: ${research.length}`);
    for (const agent of research.slice(0, 3)) {
      log.info(
        `    Agent ${agent.agent_id}: skill ${agent.skill_type_id}, ${agent.points_per_day?.toFixed(2) ?? 0} pts/day`,
      );
    }

    // Blueprints
    log.info(`\nBlueprints`);
    log.info('-'.repeat(50));
    log.info(`  Total blueprints: ${blueprints.length}`);
    const originals = blueprints.filter((b) => b.quantity === -1).length;
    const copies = blueprints.filter((b) => b.quantity === -2).length;
    log.info(`  Originals: ${originals}, Copies: ${copies}`);

    // Roles
    log.info(`\nRoles`);
    log.info('-'.repeat(50));
    log.info(`  Roles: ${roles.roles?.length ?? 0}`);
    log.info(`  Roles at HQ: ${roles.roles_at_hq?.length ?? 0}`);
    log.info(`  Roles at base: ${roles.roles_at_base?.length ?? 0}`);
    log.info(`  Roles at other: ${roles.roles_at_other?.length ?? 0}`);

    // Standings
    log.info(`\nStandings`);
    log.info('-'.repeat(50));
    log.info(`  Total standings: ${standings.length}`);
    for (const s of standings.slice(0, 5)) {
      log.info(`    ${s.from_type} ${s.from_id}: ${s.standing}`);
    }
    if (standings.length > 5)
      log.info(`    ... and ${standings.length - 5} more`);

    // Titles
    log.info(`\nTitles`);
    log.info('-'.repeat(50));
    log.info(`  Titles held: ${titles.length}`);
    for (const t of titles) {
      log.info(`    [${t.title_id}] ${t.name || '(unnamed)'}`);
    }

    // Contact Notifications
    log.info(`\nContact Notifications`);
    log.info('-'.repeat(50));
    log.info(`  Notifications: ${contactNotifications.length}`);

    // Corporation History
    log.info(`\nCorporation History`);
    log.info('-'.repeat(50));
    log.info(`  Corporations joined: ${corpHistory.length}`);
    for (const entry of corpHistory.slice(0, 5)) {
      const date = new Date(entry.start_date).toLocaleDateString();
      log.info(
        `    ${date}: Corp ${entry.corporation_id} (record ${entry.record_id})`,
      );
    }
    if (corpHistory.length > 5)
      log.info(`    ... and ${corpHistory.length - 5} more`);

    // Jump Fatigue
    log.info(`\nJump Fatigue`);
    log.info('-'.repeat(50));
    if (fatigue.jump_fatigue_expire_date) {
      log.info(`  Fatigue expires: ${fatigue.jump_fatigue_expire_date}`);
      log.info(`  Last jump:       ${fatigue.last_jump_date || 'unknown'}`);
      log.info(`  Last update:     ${fatigue.last_update_date || 'unknown'}`);
    } else {
      log.info('  No jump fatigue');
    }

    // Medals
    log.info(`\nMedals`);
    log.info('-'.repeat(50));
    log.info(`  Medals earned: ${medals.length}`);
    for (const m of medals.slice(0, 3)) {
      log.info(
        `    Medal ${m.medal_id} from corp ${m.corporation_id} (${m.status})`,
      );
    }

    // Notifications
    log.info(`\nNotifications`);
    log.info('-'.repeat(50));
    log.info(`  Recent notifications: ${notifications.length}`);
    for (const n of notifications.slice(0, 5)) {
      const date = new Date(n.timestamp).toLocaleDateString();
      log.info(
        `    ${date} | ${n.type} | from ${n.sender_type} ${n.sender_id}`,
      );
    }
    if (notifications.length > 5)
      log.info(`    ... and ${notifications.length - 5} more`);
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
