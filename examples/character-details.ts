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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Character Details\n');

    console.log('Fetching character data...');
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
    console.log('Agent Research');
    console.log('-'.repeat(50));
    console.log(`  Active research agents: ${research.length}`);
    for (const agent of research.slice(0, 3)) {
      console.log(`    Agent ${agent.agent_id}: skill ${agent.skill_type_id}, ${agent.points_per_day?.toFixed(2) ?? 0} pts/day`);
    }

    // Blueprints
    console.log(`\nBlueprints`);
    console.log('-'.repeat(50));
    console.log(`  Total blueprints: ${blueprints.length}`);
    const originals = blueprints.filter((b) => b.quantity === -1).length;
    const copies = blueprints.filter((b) => b.quantity === -2).length;
    console.log(`  Originals: ${originals}, Copies: ${copies}`);

    // Roles
    console.log(`\nRoles`);
    console.log('-'.repeat(50));
    console.log(`  Roles: ${roles.roles?.length ?? 0}`);
    console.log(`  Roles at HQ: ${roles.roles_at_hq?.length ?? 0}`);
    console.log(`  Roles at base: ${roles.roles_at_base?.length ?? 0}`);
    console.log(`  Roles at other: ${roles.roles_at_other?.length ?? 0}`);

    // Standings
    console.log(`\nStandings`);
    console.log('-'.repeat(50));
    console.log(`  Total standings: ${standings.length}`);
    for (const s of standings.slice(0, 5)) {
      console.log(`    ${s.from_type} ${s.from_id}: ${s.standing}`);
    }
    if (standings.length > 5) console.log(`    ... and ${standings.length - 5} more`);

    // Titles
    console.log(`\nTitles`);
    console.log('-'.repeat(50));
    console.log(`  Titles held: ${titles.length}`);
    for (const t of titles) {
      console.log(`    [${t.title_id}] ${t.name || '(unnamed)'}`);
    }

    // Contact Notifications
    console.log(`\nContact Notifications`);
    console.log('-'.repeat(50));
    console.log(`  Notifications: ${contactNotifications.length}`);

    // Corporation History
    console.log(`\nCorporation History`);
    console.log('-'.repeat(50));
    console.log(`  Corporations joined: ${corpHistory.length}`);
    for (const entry of corpHistory.slice(0, 5)) {
      const date = new Date(entry.start_date).toLocaleDateString();
      console.log(`    ${date}: Corp ${entry.corporation_id} (record ${entry.record_id})`);
    }
    if (corpHistory.length > 5) console.log(`    ... and ${corpHistory.length - 5} more`);

    // Jump Fatigue
    console.log(`\nJump Fatigue`);
    console.log('-'.repeat(50));
    if (fatigue.jump_fatigue_expire_date) {
      console.log(`  Fatigue expires: ${fatigue.jump_fatigue_expire_date}`);
      console.log(`  Last jump:       ${fatigue.last_jump_date || 'unknown'}`);
      console.log(`  Last update:     ${fatigue.last_update_date || 'unknown'}`);
    } else {
      console.log('  No jump fatigue');
    }

    // Medals
    console.log(`\nMedals`);
    console.log('-'.repeat(50));
    console.log(`  Medals earned: ${medals.length}`);
    for (const m of medals.slice(0, 3)) {
      console.log(`    Medal ${m.medal_id} from corp ${m.corporation_id} (${m.status})`);
    }

    // Notifications
    console.log(`\nNotifications`);
    console.log('-'.repeat(50));
    console.log(`  Recent notifications: ${notifications.length}`);
    for (const n of notifications.slice(0, 5)) {
      const date = new Date(n.timestamp).toLocaleDateString();
      console.log(`    ${date} | ${n.type} | from ${n.sender_type} ${n.sender_id}`);
    }
    if (notifications.length > 5) console.log(`    ... and ${notifications.length - 5} more`);

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
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
