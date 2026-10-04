/**
 * ESI.ts Example: Character Lookup
 *
 * Looks up a character's public info, portrait, and corporation.
 * All public endpoints — no auth required.
 *
 * Usage: npm run example:character
 *
 * @nightly public
 */
import { EsiClient } from '../src/EsiClient';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const CHARACTER_ID = 1689391488; // deiseman

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info(`Looking up character ${CHARACTER_ID}...\n`);

    const [character, portrait] = await Promise.all([
      client.characters.getCharacterPublicInfo(CHARACTER_ID),
      client.characters.getCharacterPortrait(CHARACTER_ID),
    ]);

    log.info('Character Info');
    log.info('-'.repeat(40));
    log.info(`  Name:            ${character.name}`);
    log.info(
      `  Birthday:        ${new Date(character.birthday).toLocaleDateString()}`,
    );
    log.info(`  Security Status: ${character.security_status?.toFixed(2)}`);
    log.info(`  Corporation ID:  ${character.corporation_id}`);
    if (character.alliance_id) {
      log.info(`  Alliance ID:     ${character.alliance_id}`);
    }

    log.info('\nPortrait URLs');
    log.info('-'.repeat(40));
    log.info(`  64x64:   ${portrait.px64x64}`);
    log.info(`  128x128: ${portrait.px128x128}`);
    log.info(`  256x256: ${portrait.px256x256}`);
    log.info(`  512x512: ${portrait.px512x512}`);

    // Fetch corporation info
    const corp = await client.corporations.getCorporationInfo(
      character.corporation_id,
    );
    log.info('\nCorporation');
    log.info('-'.repeat(40));
    log.info(`  Name:    ${corp.name} [${corp.ticker}]`);
    log.info(`  Members: ${corp.member_count?.toLocaleString()}`);
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
