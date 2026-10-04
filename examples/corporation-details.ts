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

const CORP_ID = 98135622;

async function tryOrSkip(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 403 || err.statusCode === 401)
    ) {
      log.info(`  ${label}: requires director roles — skipped`);
    } else {
      throw err;
    }
  }
}

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Corporation Details\n');

    // --- Public endpoints ---
    log.info('Public Data');
    log.info('='.repeat(50));

    const [allianceHistory, icon, npcCorps] = await Promise.all([
      client.corporations.getCorporationAllianceHistory(CORP_ID),
      client.corporations.getCorporationIcon(CORP_ID),
      client.corporations.getNpcCorporations(),
    ]);

    log.info(`\nAlliance History (${allianceHistory.length} entries)`);
    log.info('-'.repeat(50));
    for (const entry of allianceHistory.slice(0, 5)) {
      log.info(
        `  ${entry.start_date}: alliance ${entry.alliance_id ?? 'none'}`,
      );
    }

    log.info(`\nCorporation Icon`);
    log.info('-'.repeat(50));
    log.info(`  64x64:   ${icon.px64x64 ?? 'N/A'}`);
    log.info(`  128x128: ${icon.px128x128 ?? 'N/A'}`);
    log.info(`  256x256: ${icon.px256x256 ?? 'N/A'}`);

    log.info(`\nNPC Corporations`);
    log.info('-'.repeat(50));
    log.info(`  Total NPC corps: ${npcCorps.length}`);

    // --- Authenticated endpoints (most need director) ---
    log.info('\n\nAuthenticated Data (director roles required)');
    log.info('='.repeat(50));

    log.info('\nBlueprints');
    log.info('-'.repeat(50));
    await tryOrSkip('Blueprints', async () => {
      const bps = await client.corporations.getCorporationBlueprints(CORP_ID);
      log.info(`  Corporation blueprints: ${bps.length}`);
    });

    log.info('\nAudit Log (ALSC)');
    log.info('-'.repeat(50));
    await tryOrSkip('Audit log', async () => {
      const logs = await client.corporations.getCorporationAlscLogs(CORP_ID);
      log.info(`  Container log entries: ${logs.length}`);
    });

    log.info('\nDivisions');
    log.info('-'.repeat(50));
    await tryOrSkip('Divisions', async () => {
      const divs = await client.corporations.getCorporationDivisions(CORP_ID);
      log.info(`  Hangar divisions: ${divs.hangar?.length ?? 0}`);
      log.info(`  Wallet divisions: ${divs.wallet?.length ?? 0}`);
    });

    log.info('\nFacilities');
    log.info('-'.repeat(50));
    await tryOrSkip('Facilities', async () => {
      const facs = await client.corporations.getCorporationFacilities(CORP_ID);
      log.info(`  Corporation facilities: ${facs.length}`);
    });

    log.info('\nMedals');
    log.info('-'.repeat(50));
    await tryOrSkip('Medals', async () => {
      const medals = await client.corporations.getCorporationMedals(CORP_ID);
      log.info(`  Created medals: ${medals.length}`);
    });
    await tryOrSkip('Issued medals', async () => {
      const issued =
        await client.corporations.getCorporationIssuedMedals(CORP_ID);
      log.info(`  Issued medals: ${issued.length}`);
    });

    log.info('\nMembers');
    log.info('-'.repeat(50));
    await tryOrSkip('Members', async () => {
      const members = await client.corporations.getCorporationMembers(CORP_ID);
      log.info(`  Member count: ${members.length}`);
    });
    await tryOrSkip('Member limit', async () => {
      const limit =
        await client.corporations.getCorporationMemberLimit(CORP_ID);
      log.info(`  Member limit: ${limit}`);
    });
    await tryOrSkip('Member titles', async () => {
      const titles =
        await client.corporations.getCorporationMemberTitles(CORP_ID);
      log.info(`  Members with titles: ${titles.length}`);
    });
    await tryOrSkip('Member tracking', async () => {
      const tracking =
        await client.corporations.getCorporationMemberTracking(CORP_ID);
      log.info(`  Tracked members: ${tracking.length}`);
    });

    log.info('\nRoles');
    log.info('-'.repeat(50));
    await tryOrSkip('Member roles', async () => {
      const roles = await client.corporations.getCorporationRoles(CORP_ID);
      log.info(`  Members with roles: ${roles.length}`);
    });
    await tryOrSkip('Role history', async () => {
      const history =
        await client.corporations.getCorporationRolesHistory(CORP_ID);
      log.info(`  Role change history: ${history.length}`);
    });

    log.info('\nFinancial');
    log.info('-'.repeat(50));
    await tryOrSkip('Shareholders', async () => {
      const shareholders =
        await client.corporations.getCorporationShareholders(CORP_ID);
      log.info(`  Shareholders: ${shareholders.length}`);
    });

    log.info('\nStandings');
    log.info('-'.repeat(50));
    await tryOrSkip('Standings', async () => {
      const standings =
        await client.corporations.getCorporationStandings(CORP_ID);
      log.info(`  Corporation standings: ${standings.length}`);
    });

    log.info('\nStarbases');
    log.info('-'.repeat(50));
    await tryOrSkip('Starbases', async () => {
      const starbases =
        await client.corporations.getCorporationStarbases(CORP_ID);
      log.info(`  Starbases: ${starbases.length}`);
      if (starbases.length > 0) {
        const detail = await client.corporations.getCorporationStarbaseDetail(
          CORP_ID,
          starbases[0]!.starbase_id,
        );
        log.info(
          `  Detail for ${starbases[0]!.starbase_id}: state ${starbases[0]!.state ?? 'unknown'}, anchoring by ${detail.anchor}`,
        );
      }
    });

    log.info('\nStructures');
    log.info('-'.repeat(50));
    await tryOrSkip('Structures', async () => {
      const structures =
        await client.corporations.getCorporationStructures(CORP_ID);
      log.info(`  Corporation structures: ${structures.length}`);
    });

    log.info('\nTitles');
    log.info('-'.repeat(50));
    await tryOrSkip('Titles', async () => {
      const titles = await client.corporations.getCorporationTitles(CORP_ID);
      log.info(`  Defined titles: ${titles.length}`);
    });
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
