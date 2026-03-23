/**
 * ESI.ts Example: Alliance Information
 *
 * Looks up an alliance, its member corporations, and icons.
 *
 * Usage: npm run example:alliance
 */
import { EsiClient } from '../src/EsiClient';

const GOONSWARM_ALLIANCE_ID = 1354830081;

async function main() {
  const client = new EsiClient();

  try {
    console.log('Alliance Lookup\n');

    const [info, corps, icons] = await Promise.all([
      client.alliance.getAllianceById(GOONSWARM_ALLIANCE_ID),
      client.alliance.getCorporations(GOONSWARM_ALLIANCE_ID),
      client.alliance.getIcons(GOONSWARM_ALLIANCE_ID),
    ]);

    console.log('Alliance Info');
    console.log('-'.repeat(40));
    console.log(`  Name:          ${info.name} [${info.ticker}]`);
    console.log(`  Founded:       ${new Date(info.date_founded).toLocaleDateString()}`);
    console.log(`  Creator Corp:  ${info.creator_corporation_id}`);
    console.log(`  Executor Corp: ${info.executor_corporation_id}`);
    console.log(`  Member Corps:  ${corps.length}`);

    console.log('\nIcons');
    console.log('-'.repeat(40));
    console.log(`  64x64:  ${icons.px64x64}`);
    console.log(`  128x128: ${icons.px128x128}`);

    // Look up first 3 member corps
    console.log('\nSample Member Corporations');
    console.log('-'.repeat(40));
    const sampleCorps = corps.slice(0, 3);
    const corpInfos = await Promise.all(
      sampleCorps.map((id: number) => client.corporations.getCorporationInfo(id))
    );
    for (const corp of corpInfos) {
      console.log(`  ${corp.name} [${corp.ticker}] - ${corp.member_count?.toLocaleString()} members`);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
