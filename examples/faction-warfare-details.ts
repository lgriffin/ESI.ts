/**
 * ESI.ts Example: Faction Warfare Details
 *
 * Demonstrates faction warfare leaderboards (overall, characters,
 * corporations), faction wars, and per-character/corporation FW stats.
 *
 * The leaderboards and wars are public. The character and corporation stats
 * need an access token (ESI_ACCESS_TOKEN) and are skipped without one.
 *
 * Usage: npm run example:faction-details
 *
 * @nightly mixed
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Faction Warfare Details\n');

    // --- Public leaderboards ---
    log.info('Fetching leaderboards...');
    const [overall, charLeaderboard, corpLeaderboard, wars] = await Promise.all(
      [
        client.factions.getLeaderboardsOverall(),
        client.factions.getLeaderboardsCharacters(),
        client.factions.getLeaderboardsCorporations(),
        client.factions.getWars(),
      ],
    );

    log.info('Overall Leaderboard');
    log.info('-'.repeat(50));
    log.info(`  ${JSON.stringify(Object.keys(overall))}`);

    log.info('\nCharacter Leaderboard');
    log.info('-'.repeat(50));
    log.info(`  ${JSON.stringify(Object.keys(charLeaderboard))}`);

    log.info('\nCorporation Leaderboard');
    log.info('-'.repeat(50));
    log.info(`  ${JSON.stringify(Object.keys(corpLeaderboard))}`);

    log.info('\nFaction Wars');
    log.info('-'.repeat(50));
    log.info(`  Active wars: ${wars.length}`);
    for (const war of wars) {
      log.info(`    Faction ${war.against_id} vs ${war.faction_id}`);
    }

    if (!process.env.ESI_ACCESS_TOKEN) {
      log.info(
        '\nCharacter and corporation FW stats need ESI_ACCESS_TOKEN — skipped',
      );
      return;
    }

    // --- Character FW stats (auth) ---
    log.info('\nCharacter FW Stats');
    log.info('-'.repeat(50));
    try {
      const charStats = await client.factions.getCharacterStats(CHARACTER_ID);
      log.info(`  Faction ID:  ${charStats.faction_id ?? 'not enlisted'}`);
      log.info(`  Kills:       ${JSON.stringify(charStats.kills)}`);
      log.info(`  VP:          ${JSON.stringify(charStats.victory_points)}`);
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 404 || err.statusCode === 403)
      ) {
        log.info('  Character is not enlisted in faction warfare');
      } else {
        throw err;
      }
    }

    // --- Corporation FW stats (auth, may 403) ---
    log.info('\nCorporation FW Stats');
    log.info('-'.repeat(50));
    try {
      const corpStats = await client.factions.getCorporationStats(CORP_ID);
      log.info(`  Faction ID:  ${corpStats.faction_id ?? 'not enlisted'}`);
      log.info(`  Kills:       ${JSON.stringify(corpStats.kills)}`);
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 403 || err.statusCode === 401)
      ) {
        log.info('  Requires corporation roles — skipped');
      } else if (err instanceof EsiError && err.statusCode === 404) {
        log.info('  Corporation is not enlisted in faction warfare');
      } else {
        throw err;
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
