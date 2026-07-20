/**
 * ESI.ts Example: Dogma Effects, Meta API & Sovereignty Systems
 *
 * Demonstrates dogma effects lookup, the ESI OpenAPI spec endpoint,
 * sovereignty system ownership, and war killmails.
 *
 * Usage: npm run example:dogma-meta-sov
 */
import { EsiClient } from '../src/EsiClient';

const SAMPLE_WAR_ID = 761500;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Dogma Effects, Meta & Sovereignty\n');

    // --- Dogma Effects ---
    console.log('Dogma Effects');
    console.log('-'.repeat(50));
    const effectIds = await client.dogma.getEffects();
    console.log(`  Total effects: ${effectIds.length}`);

    const sampleEffect = await client.dogma.getEffectById(effectIds[0]!);
    console.log(
      `  Sample effect: ${sampleEffect.display_name || sampleEffect.name || `ID ${sampleEffect.effect_id}`}`,
    );
    console.log(`    Category: ${sampleEffect.effect_category}`);
    console.log(`    Published: ${sampleEffect.published}`);

    // --- Sovereignty Systems ---
    console.log('\nSovereignty Systems');
    console.log('-'.repeat(50));
    const sovResult = await client.sovereignty.getSovereigntySystems();
    const sovSystems = sovResult.solar_systems;
    console.log(`  Total sovereignty entries: ${sovSystems.length}`);

    const claimed = sovSystems.filter((s) => s.claim.alliance);
    console.log(`  Systems claimed by alliances: ${claimed.length}`);

    const allianceCounts = new Map<number, number>();
    for (const s of claimed) {
      const aid = s.claim.alliance!.alliance_id;
      allianceCounts.set(aid, (allianceCounts.get(aid) || 0) + 1);
    }
    const topAlliances = [...allianceCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log('  Top 5 alliances by systems held:');
    for (const [allianceId, count] of topAlliances) {
      console.log(`    Alliance ${allianceId}: ${count} systems`);
    }

    // --- Meta: OpenAPI spec ---
    console.log('\nESI Meta');
    console.log('-'.repeat(50));
    const spec = await client.meta.getOpenApiJson();
    console.log(`  OpenAPI version: ${spec.openapi || spec.swagger}`);
    console.log(`  API title: ${spec.info?.title}`);
    console.log(`  API version: ${spec.info?.version}`);
    const pathCount = spec.paths ? Object.keys(spec.paths).length : 0;
    console.log(`  Paths: ${pathCount}`);

    // --- War Killmails ---
    console.log('\nWar Killmails');
    console.log('-'.repeat(50));
    try {
      const killmails = await client.wars.getWarKillmails(SAMPLE_WAR_ID);
      console.log(`  War ${SAMPLE_WAR_ID}: ${killmails.length} killmails`);
      for (const km of killmails.slice(0, 3)) {
        console.log(
          `    Killmail ${km.killmail_id} (hash: ${km.killmail_hash})`,
        );
      }
      if (killmails.length > 3) {
        console.log(`    ... and ${killmails.length - 3} more`);
      }
    } catch {
      console.log(`  War ${SAMPLE_WAR_ID}: no killmails found`);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
