/**
 * ESI.ts Example: Killmails
 *
 * Demonstrates the two-step killmail lookup: first fetch recent killmail
 * summaries for a character (auth required), then look up full details
 * for each killmail using the public endpoint (no auth for the detail call).
 *
 * ESI Scopes Required:
 *   - esi-killmails.read_killmails.v1  (character recent killmail summaries)
 *   - None for getKillmail() — killmail details are public once you have the hash
 *
 * Usage: npm run example:killmails
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-killmails-demo' });

  try {
    console.log('Killmail Lookup\n');

    // Step 1: Get recent killmail summaries (IDs + hashes)
    // Scope: esi-killmails.read_killmails.v1
    console.log('Fetching recent killmail summaries...');
    const summaries = await client.killmails.getCharacterRecentKillmails(CHARACTER_ID);
    console.log(`  Found ${summaries.length} recent killmails\n`);

    if (summaries.length === 0) {
      console.log('No killmails found. This character has been staying safe!');
      return;
    }

    // Step 2: Fetch full details for up to 5 killmails in parallel
    // No scope needed — killmail details are public
    const batch = summaries.slice(0, 5);
    console.log(`Fetching details for ${batch.length} killmails...\n`);

    const details = await Promise.all(
      batch.map(s => client.killmails.getKillmail(s.killmail_id, s.killmail_hash)),
    );

    console.log('Recent Killmails');
    console.log('='.repeat(60));
    for (const km of details) {
      console.log(`\nKillmail #${km.killmail_id}`);
      console.log('-'.repeat(40));
      console.log(`  Time:        ${km.killmail_time}`);
      console.log(`  System:      ${km.solar_system_id}`);
      console.log(`  Victim ship: Type ${km.victim.ship_type_id}`);
      if (km.victim.character_id) {
        console.log(`  Victim:      Character ${km.victim.character_id}`);
      }
      if (km.victim.corporation_id) {
        console.log(`  Victim corp: ${km.victim.corporation_id}`);
      }
      console.log(`  Attackers:   ${km.attackers.length}`);

      const finalBlow = km.attackers.find(a => a.final_blow);
      if (finalBlow) {
        console.log(`  Final blow:  Character ${finalBlow.character_id || 'NPC'} (Type ${finalBlow.ship_type_id || 'unknown'})`);
        console.log(`  Damage:      ${finalBlow.damage_done.toLocaleString()}`);
      }

      const totalDamage = km.attackers.reduce((sum, a) => sum + a.damage_done, 0);
      console.log(`  Total dmg:   ${totalDamage.toLocaleString()}`);
      if (km.victim.items) {
        console.log(`  Items:       ${km.victim.items.length} item types involved`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`Displayed ${details.length} of ${summaries.length} total killmails`);

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scope esi-killmails.read_killmails.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
