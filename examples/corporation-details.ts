/**
 * ESI.ts Example: Corporation Details
 *
 * Demonstrates all corporation-level endpoints: alliance history, icon,
 * NPC corporations, and authenticated endpoints (blueprints, divisions,
 * facilities, medals, members, roles, shareholders, standings, structures, etc).
 *
 * Most authenticated endpoints require director roles and will gracefully
 * skip with a message if the token lacks permission.
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * Usage: npm run example:corporation-details
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CORP_ID = 98135622;

async function tryOrSkip(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 403 || err.statusCode === 401)) {
      console.log(`  ${label}: requires director roles — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient();

  try {
    console.log('Corporation Details\n');

    // --- Public endpoints ---
    console.log('Public Data');
    console.log('='.repeat(50));

    const [allianceHistory, icon, npcCorps] = await Promise.all([
      client.corporations.getCorporationAllianceHistory(CORP_ID),
      client.corporations.getCorporationIcon(CORP_ID),
      client.corporations.getNpcCorporations(),
    ]);

    console.log(`\nAlliance History (${allianceHistory.length} entries)`);
    console.log('-'.repeat(50));
    for (const entry of allianceHistory.slice(0, 5)) {
      console.log(`  ${entry.start_date}: alliance ${entry.alliance_id ?? 'none'}`);
    }

    console.log(`\nCorporation Icon`);
    console.log('-'.repeat(50));
    console.log(`  64x64:   ${icon.px64x64 ?? 'N/A'}`);
    console.log(`  128x128: ${icon.px128x128 ?? 'N/A'}`);
    console.log(`  256x256: ${icon.px256x256 ?? 'N/A'}`);

    console.log(`\nNPC Corporations`);
    console.log('-'.repeat(50));
    console.log(`  Total NPC corps: ${npcCorps.length}`);

    // --- Authenticated endpoints (most need director) ---
    console.log('\n\nAuthenticated Data (director roles required)');
    console.log('='.repeat(50));

    console.log('\nBlueprints');
    console.log('-'.repeat(50));
    await tryOrSkip('Blueprints', async () => {
      const bps = await client.corporations.getCorporationBlueprints(CORP_ID);
      console.log(`  Corporation blueprints: ${bps.length}`);
    });

    console.log('\nAudit Log (ALSC)');
    console.log('-'.repeat(50));
    await tryOrSkip('Audit log', async () => {
      const logs = await client.corporations.getCorporationAlscLogs(CORP_ID);
      console.log(`  Container log entries: ${logs.length}`);
    });

    console.log('\nDivisions');
    console.log('-'.repeat(50));
    await tryOrSkip('Divisions', async () => {
      const divs = await client.corporations.getCorporationDivisions(CORP_ID);
      console.log(`  Hangar divisions: ${divs.hangar?.length ?? 0}`);
      console.log(`  Wallet divisions: ${divs.wallet?.length ?? 0}`);
    });

    console.log('\nFacilities');
    console.log('-'.repeat(50));
    await tryOrSkip('Facilities', async () => {
      const facs = await client.corporations.getCorporationFacilities(CORP_ID);
      console.log(`  Corporation facilities: ${facs.length}`);
    });

    console.log('\nMedals');
    console.log('-'.repeat(50));
    await tryOrSkip('Medals', async () => {
      const medals = await client.corporations.getCorporationMedals(CORP_ID);
      console.log(`  Created medals: ${medals.length}`);
    });
    await tryOrSkip('Issued medals', async () => {
      const issued = await client.corporations.getCorporationIssuedMedals(CORP_ID);
      console.log(`  Issued medals: ${issued.length}`);
    });

    console.log('\nMembers');
    console.log('-'.repeat(50));
    await tryOrSkip('Members', async () => {
      const members = await client.corporations.getCorporationMembers(CORP_ID);
      console.log(`  Member count: ${members.length}`);
    });
    await tryOrSkip('Member limit', async () => {
      const limit = await client.corporations.getCorporationMemberLimit(CORP_ID);
      console.log(`  Member limit: ${limit}`);
    });
    await tryOrSkip('Member titles', async () => {
      const titles = await client.corporations.getCorporationMemberTitles(CORP_ID);
      console.log(`  Members with titles: ${titles.length}`);
    });
    await tryOrSkip('Member tracking', async () => {
      const tracking = await client.corporations.getCorporationMemberTracking(CORP_ID);
      console.log(`  Tracked members: ${tracking.length}`);
    });

    console.log('\nRoles');
    console.log('-'.repeat(50));
    await tryOrSkip('Member roles', async () => {
      const roles = await client.corporations.getCorporationRoles(CORP_ID);
      console.log(`  Members with roles: ${roles.length}`);
    });
    await tryOrSkip('Role history', async () => {
      const history = await client.corporations.getCorporationRolesHistory(CORP_ID);
      console.log(`  Role change history: ${history.length}`);
    });

    console.log('\nFinancial');
    console.log('-'.repeat(50));
    await tryOrSkip('Shareholders', async () => {
      const shareholders = await client.corporations.getCorporationShareholders(CORP_ID);
      console.log(`  Shareholders: ${shareholders.length}`);
    });

    console.log('\nStandings');
    console.log('-'.repeat(50));
    await tryOrSkip('Standings', async () => {
      const standings = await client.corporations.getCorporationStandings(CORP_ID);
      console.log(`  Corporation standings: ${standings.length}`);
    });

    console.log('\nStarbases');
    console.log('-'.repeat(50));
    await tryOrSkip('Starbases', async () => {
      const starbases = await client.corporations.getCorporationStarbases(CORP_ID);
      console.log(`  Starbases: ${starbases.length}`);
      if (starbases.length > 0) {
        const detail = await client.corporations.getCorporationStarbaseDetail(
          CORP_ID,
          starbases[0]!.starbase_id,
        );
        console.log(`  Detail for ${starbases[0]!.starbase_id}: state ${detail.state}`);
      }
    });

    console.log('\nStructures');
    console.log('-'.repeat(50));
    await tryOrSkip('Structures', async () => {
      const structures = await client.corporations.getCorporationStructures(CORP_ID);
      console.log(`  Corporation structures: ${structures.length}`);
    });

    console.log('\nTitles');
    console.log('-'.repeat(50));
    await tryOrSkip('Titles', async () => {
      const titles = await client.corporations.getCorporationTitles(CORP_ID);
      console.log(`  Defined titles: ${titles.length}`);
    });

  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
