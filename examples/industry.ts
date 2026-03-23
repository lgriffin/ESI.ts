/**
 * ESI.ts Example: Industry & Insurance
 *
 * Fetches public industry data: facility locations, system cost indices,
 * and insurance prices for ships.
 *
 * Usage: npm run example:industry
 */
import { EsiClient } from '../src/EsiClient';

async function main() {
  const client = new EsiClient();

  try {
    console.log('Industry & Insurance Data\n');

    const [facilities, systems, insurance] = await Promise.all([
      client.industry.getIndustryFacilities(),
      client.industry.getIndustrySystems(),
      client.insurance.getInsurancePrices(),
    ]);

    console.log('Industry Facilities');
    console.log('-'.repeat(40));
    console.log(`  Total facilities: ${facilities.length}`);
    // Show first 3
    for (const f of facilities.slice(0, 3)) {
      console.log(`  Facility ${f.facility_id} in system ${f.solar_system_id} (owner: ${f.owner_id}, type: ${f.type_id})`);
    }

    console.log('\nIndustry System Cost Indices (top 5 by manufacturing)');
    console.log('-'.repeat(60));
    const withManufacturing = systems
      .map((s: any) => ({
        system_id: s.solar_system_id,
        manufacturing: s.cost_indices?.find((c: any) => c.activity === 'manufacturing')?.cost_index ?? 0,
      }))
      .sort((a: any, b: any) => b.manufacturing - a.manufacturing)
      .slice(0, 5);

    for (const s of withManufacturing) {
      console.log(`  System ${s.system_id}: ${(s.manufacturing * 100).toFixed(4)}%`);
    }

    console.log('\nInsurance Prices (sample ships)');
    console.log('-'.repeat(50));
    const sampleTypes = [587, 24690, 17703, 11399]; // Rifter, Hurricane, Raven Navy, Raven
    for (const typeId of sampleTypes) {
      const entry = insurance.find((i: any) => i.type_id === typeId);
      if (entry && entry.levels?.length > 0) {
        const platinum = entry.levels.find((l: any) => l.name === 'Platinum');
        if (platinum) {
          console.log(`  Type ${typeId}: Platinum cost ${platinum.cost.toLocaleString()} ISK -> payout ${platinum.payout.toLocaleString()} ISK`);
        }
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
