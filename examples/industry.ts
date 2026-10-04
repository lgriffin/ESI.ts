/**
 * ESI.ts Example: Industry & Insurance
 *
 * Fetches public industry data: facility locations, system cost indices,
 * and insurance prices for ships.
 *
 * Usage: npm run example:industry
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Industry & Insurance Data\n');

    const [facilities, systems, insurance] = await Promise.all([
      client.industry.getIndustryFacilities(),
      client.industry.getIndustrySystems(),
      client.insurance.getInsurancePrices(),
    ]);

    log.info('Industry Facilities');
    log.info('-'.repeat(40));
    log.info(`  Total facilities: ${facilities.length}`);
    // Show first 3
    for (const f of facilities.slice(0, 3)) {
      log.info(
        `  Facility ${f.facility_id} in system ${f.solar_system_id} (owner: ${f.owner_id}, type: ${f.type_id})`,
      );
    }

    log.info('\nIndustry System Cost Indices (top 5 by manufacturing)');
    log.info('-'.repeat(60));
    const withManufacturing = systems
      .map((s: any) => ({
        system_id: s.solar_system_id,
        manufacturing:
          s.cost_indices?.find((c: any) => c.activity === 'manufacturing')
            ?.cost_index ?? 0,
      }))
      .sort((a: any, b: any) => b.manufacturing - a.manufacturing)
      .slice(0, 5);

    for (const s of withManufacturing) {
      log.info(
        `  System ${s.system_id}: ${(s.manufacturing * 100).toFixed(4)}%`,
      );
    }

    log.info('\nInsurance Prices (sample ships)');
    log.info('-'.repeat(50));
    const sampleTypes = [587, 24690, 17703, 11399]; // Rifter, Hurricane, Raven Navy, Raven
    for (const typeId of sampleTypes) {
      const entry = insurance.find((i: any) => i.type_id === typeId);
      if (entry && entry.levels?.length > 0) {
        const platinum = entry.levels.find((l: any) => l.name === 'Platinum');
        if (platinum) {
          log.info(
            `  Type ${typeId}: Platinum cost ${platinum.cost.toLocaleString()} ISK -> payout ${platinum.payout.toLocaleString()} ISK`,
          );
        }
      }
    }

    // Planetary interaction: one schematic, recorded by the contract tests
    const schematic = await client.pi.getSchematicInformation(65);
    log.info(
      `\nPI schematic 65: ${schematic.schematic_name}, cycle ${schematic.cycle_time}s`,
    );
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
