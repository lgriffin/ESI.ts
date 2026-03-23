/**
 * ESI.ts Example: Character Lookup
 *
 * Looks up a character's public info, portrait, and corporation.
 * All public endpoints — no auth required.
 *
 * Usage: npm run example:character
 */
import { EsiClient } from '../src/EsiClient';

const CHARACTER_ID = 1689391488; // deiseman

async function main() {
  const client = new EsiClient();

  try {
    console.log(`Looking up character ${CHARACTER_ID}...\n`);

    const [character, portrait] = await Promise.all([
      client.characters.getCharacterPublicInfo(CHARACTER_ID),
      client.characters.getCharacterPortrait(CHARACTER_ID),
    ]);

    console.log('Character Info');
    console.log('-'.repeat(40));
    console.log(`  Name:            ${character.name}`);
    console.log(`  Birthday:        ${new Date(character.birthday).toLocaleDateString()}`);
    console.log(`  Security Status: ${character.security_status?.toFixed(2)}`);
    console.log(`  Corporation ID:  ${character.corporation_id}`);
    if (character.alliance_id) {
      console.log(`  Alliance ID:     ${character.alliance_id}`);
    }

    console.log('\nPortrait URLs');
    console.log('-'.repeat(40));
    console.log(`  64x64:   ${portrait.px64x64}`);
    console.log(`  128x128: ${portrait.px128x128}`);
    console.log(`  256x256: ${portrait.px256x256}`);
    console.log(`  512x512: ${portrait.px512x512}`);

    // Fetch corporation info
    const corp = await client.corporations.getCorporationInfo(character.corporation_id);
    console.log('\nCorporation');
    console.log('-'.repeat(40));
    console.log(`  Name:    ${corp.name} [${corp.ticker}]`);
    console.log(`  Members: ${corp.member_count?.toLocaleString()}`);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
