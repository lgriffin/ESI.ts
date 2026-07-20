/**
 * ESI.ts Example: Faction Warfare Details
 *
 * Demonstrates faction warfare leaderboards (overall, characters,
 * corporations), faction wars, and per-character/corporation FW stats.
 *
 * REQUIRES AUTHENTICATION for character/corporation stats.
 *
 * Usage: npm run example:faction-details
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const CORP_ID = 98135622;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Faction Warfare Details\n');

    // --- Public leaderboards ---
    console.log('Fetching leaderboards...');
    const [overall, charLeaderboard, corpLeaderboard, wars] = await Promise.all(
      [
        client.factions.getLeaderboardsOverall(),
        client.factions.getLeaderboardsCharacters(),
        client.factions.getLeaderboardsCorporations(),
        client.factions.getWars(),
      ],
    );

    console.log('Overall Leaderboard');
    console.log('-'.repeat(50));
    console.log(`  ${JSON.stringify(Object.keys(overall))}`);

    console.log('\nCharacter Leaderboard');
    console.log('-'.repeat(50));
    console.log(`  ${JSON.stringify(Object.keys(charLeaderboard))}`);

    console.log('\nCorporation Leaderboard');
    console.log('-'.repeat(50));
    console.log(`  ${JSON.stringify(Object.keys(corpLeaderboard))}`);

    console.log('\nFaction Wars');
    console.log('-'.repeat(50));
    console.log(`  Active wars: ${wars.length}`);
    for (const war of wars) {
      console.log(`    Faction ${war.against_id} vs ${war.faction_id}`);
    }

    // --- Character FW stats (auth) ---
    console.log('\nCharacter FW Stats');
    console.log('-'.repeat(50));
    try {
      const charStats = await client.factions.getCharacterStats(CHARACTER_ID);
      console.log(`  Faction ID:  ${charStats.faction_id ?? 'not enlisted'}`);
      console.log(`  Kills:       ${JSON.stringify(charStats.kills)}`);
      console.log(`  VP:          ${JSON.stringify(charStats.victory_points)}`);
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 404 || err.statusCode === 403)
      ) {
        console.log('  Character is not enlisted in faction warfare');
      } else {
        throw err;
      }
    }

    // --- Corporation FW stats (auth, may 403) ---
    console.log('\nCorporation FW Stats');
    console.log('-'.repeat(50));
    try {
      const corpStats = await client.factions.getCorporationStats(CORP_ID);
      console.log(`  Faction ID:  ${corpStats.faction_id ?? 'not enlisted'}`);
      console.log(`  Kills:       ${JSON.stringify(corpStats.kills)}`);
    } catch (err) {
      if (
        err instanceof EsiError &&
        (err.statusCode === 403 || err.statusCode === 401)
      ) {
        console.log('  Requires corporation roles — skipped');
      } else if (err instanceof EsiError && err.statusCode === 404) {
        console.log('  Corporation is not enlisted in faction warfare');
      } else {
        throw err;
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
