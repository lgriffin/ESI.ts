/**
 * ESI.ts Example: Alliance Information
 *
 * Looks up an alliance, its member corporations, and icons.
 *
 * Usage: npm run example:alliance
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const GOONSWARM_ALLIANCE_ID = 1354830081;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Alliance Lookup\n');

    const [info, corps, icons] = await Promise.all([
      client.alliance.getAllianceById(GOONSWARM_ALLIANCE_ID),
      client.alliance.getCorporations(GOONSWARM_ALLIANCE_ID),
      client.alliance.getIcons(GOONSWARM_ALLIANCE_ID),
    ]);

    log.info('Alliance Info');
    log.info('-'.repeat(40));
    log.info(`  Name:          ${info.name} [${info.ticker}]`);
    log.info(
      `  Founded:       ${new Date(info.date_founded).toLocaleDateString()}`,
    );
    log.info(`  Creator Corp:  ${info.creator_corporation_id}`);
    log.info(`  Executor Corp: ${info.executor_corporation_id}`);
    log.info(`  Member Corps:  ${corps.length}`);

    log.info('\nIcons');
    log.info('-'.repeat(40));
    log.info(`  64x64:  ${icons.px64x64}`);
    log.info(`  128x128: ${icons.px128x128}`);

    // Look up first 3 member corps
    log.info('\nSample Member Corporations');
    log.info('-'.repeat(40));
    const sampleCorps = corps.slice(0, 3);
    const corpInfos = await Promise.all(
      sampleCorps.map((id: number) =>
        client.corporations.getCorporationInfo(id),
      ),
    );
    for (const corp of corpInfos) {
      log.info(
        `  ${corp.name} [${corp.ticker}] - ${corp.member_count?.toLocaleString()} members`,
      );
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
