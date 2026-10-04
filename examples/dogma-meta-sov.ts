/**
 * ESI.ts Example: Dogma Effects, Meta API & Sovereignty Systems
 *
 * Demonstrates dogma effects lookup, the ESI OpenAPI spec endpoint,
 * sovereignty system ownership, and war killmails.
 *
 * Usage: npm run example:dogma-meta-sov
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const SAMPLE_WAR_ID = 761500;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Dogma Effects, Meta & Sovereignty\n');

    // --- Dogma Effects ---
    log.info('Dogma Effects');
    log.info('-'.repeat(50));
    const effectIds = await client.dogma.getEffects();
    log.info(`  Total effects: ${effectIds.length}`);

    const sampleEffect = await client.dogma.getEffectById(effectIds[0]!);
    log.info(
      `  Sample effect: ${sampleEffect.display_name || sampleEffect.name || `ID ${sampleEffect.effect_id}`}`,
    );
    log.info(`    Category: ${sampleEffect.effect_category}`);
    log.info(`    Published: ${sampleEffect.published}`);

    // --- Sovereignty Systems ---
    log.info('\nSovereignty Systems');
    log.info('-'.repeat(50));
    const sovResult = await client.sovereignty.getSovereigntySystems();
    const sovSystems = sovResult.solar_systems;
    log.info(`  Total sovereignty entries: ${sovSystems.length}`);

    const claimed = sovSystems.filter((s) => s.claim.alliance);
    log.info(`  Systems claimed by alliances: ${claimed.length}`);

    const allianceCounts = new Map<number, number>();
    for (const s of claimed) {
      const aid = s.claim.alliance!.alliance_id;
      allianceCounts.set(aid, (allianceCounts.get(aid) || 0) + 1);
    }
    const topAlliances = [...allianceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    log.info('  Top 5 alliances by systems held:');
    for (const [allianceId, count] of topAlliances) {
      log.info(`    Alliance ${allianceId}: ${count} systems`);
    }

    // --- Meta: OpenAPI spec ---
    log.info('\nESI Meta');
    log.info('-'.repeat(50));
    const spec = await client.meta.getOpenApiJson();
    log.info(`  OpenAPI version: ${spec.openapi || spec.swagger}`);
    log.info(`  API title: ${spec.info?.title}`);
    log.info(`  API version: ${spec.info?.version}`);
    const pathCount = spec.paths ? Object.keys(spec.paths).length : 0;
    log.info(`  Paths: ${pathCount}`);

    // --- War Killmails ---
    log.info('\nWar Killmails');
    log.info('-'.repeat(50));
    try {
      const killmails = await client.wars.getWarKillmails(SAMPLE_WAR_ID);
      log.info(`  War ${SAMPLE_WAR_ID}: ${killmails.length} killmails`);
      for (const km of killmails.slice(0, 3)) {
        log.info(`    Killmail ${km.killmail_id} (hash: ${km.killmail_hash})`);
      }
      if (killmails.length > 3) {
        log.info(`    ... and ${killmails.length - 3} more`);
      }
    } catch {
      log.info(`  War ${SAMPLE_WAR_ID}: no killmails found`);
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
