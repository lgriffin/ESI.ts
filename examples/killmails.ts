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
    clientId: 'esi-ts-killmails-demo',
  });

  try {
    log.info('Killmail Lookup\n');

    // Step 1: Get recent killmail summaries (IDs + hashes)
    // Scope: esi-killmails.read_killmails.v1
    log.info('Fetching recent killmail summaries...');
    const summaries =
      await client.killmails.getCharacterRecentKillmails(CHARACTER_ID);
    log.info(`  Found ${summaries.length} recent killmails\n`);

    if (summaries.length === 0) {
      log.info('No killmails found. This character has been staying safe!');
      return;
    }

    // Step 2: Fetch full details for up to 5 killmails in parallel
    // No scope needed — killmail details are public
    const batch = summaries.slice(0, 5);
    log.info(`Fetching details for ${batch.length} killmails...\n`);

    const details = await Promise.all(
      batch.map((s) =>
        client.killmails.getKillmail(s.killmail_id, s.killmail_hash),
      ),
    );

    log.info('Recent Killmails');
    log.info('='.repeat(60));
    for (const km of details) {
      log.info(`\nKillmail #${km.killmail_id}`);
      log.info('-'.repeat(40));
      log.info(`  Time:        ${km.killmail_time}`);
      log.info(`  System:      ${km.solar_system_id}`);
      log.info(`  Victim ship: Type ${km.victim.ship_type_id}`);
      if (km.victim.character_id) {
        log.info(`  Victim:      Character ${km.victim.character_id}`);
      }
      if (km.victim.corporation_id) {
        log.info(`  Victim corp: ${km.victim.corporation_id}`);
      }
      log.info(`  Attackers:   ${km.attackers.length}`);

      const finalBlow = km.attackers.find((a) => a.final_blow);
      if (finalBlow) {
        log.info(
          `  Final blow:  Character ${finalBlow.character_id || 'NPC'} (Type ${finalBlow.ship_type_id || 'unknown'})`,
        );
        log.info(`  Damage:      ${finalBlow.damage_done.toLocaleString()}`);
      }

      const totalDamage = km.attackers.reduce(
        (sum, a) => sum + a.damage_done,
        0,
      );
      log.info(`  Total dmg:   ${totalDamage.toLocaleString()}`);
      if (km.victim.items) {
        log.info(
          `  Items:       ${km.victim.items.length} item types involved`,
        );
      }
    }

    // Summary
    log.info('\n' + '='.repeat(60));
    log.info(
      `Displayed ${details.length} of ${summaries.length} total killmails`,
    );
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-killmails.read_killmails.v1',
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
