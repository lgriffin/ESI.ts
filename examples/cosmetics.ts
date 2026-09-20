/**
 * ESI.ts Example: SKINR Cosmetics
 *
 * Looks up SKINR designs and a character's owned licenses and components.
 * The public getSkinr endpoint works without auth; the character endpoints
 * require an ESI token with the esi.cosmetic.char:read scope.
 *
 * Usage: npm run example:cosmetics
 */
import { EsiClient } from '../src/EsiClient';
import { isNotFound } from '../src/core/util/error';

async function main() {
  const client = new EsiClient();

  const skinrId = process.env.SKINR_ID || '';
  const characterId = parseInt(process.env.CHARACTER_ID || '0', 10);

  try {
    console.log('SKINR Cosmetics\n');

    if (skinrId) {
      console.log(`Looking up SKINR design: ${skinrId}`);
      console.log('-'.repeat(60));

      try {
        const skinr = await client.cosmetics.getSkinr(skinrId);
        console.log(`  Name:       ${skinr.name}`);
        console.log(`  Creator:    ${skinr.creator_id}`);
        console.log(`  Ship Type:  ${skinr.ship_type_id}`);
        console.log(`  Tier:       ${skinr.tier.level}`);
        if (skinr.line) {
          console.log(`  Line:       ${skinr.line}`);
        }
        console.log(`  Blend Mode: ${skinr.layout.pattern_blend_mode}`);
        console.log(`  Slots:      ${skinr.layout.slots.length}`);
      } catch (err) {
        if (isNotFound(err)) {
          console.log(`  SKINR design '${skinrId}' not found.`);
        } else {
          throw err;
        }
      }
      console.log();
    } else {
      console.log(
        'Set SKINR_ID environment variable to look up a specific design.\n',
      );
    }

    if (!characterId) {
      console.log(
        'Set CHARACTER_ID environment variable to view owned licenses and components.',
      );
      return;
    }

    console.log(`Character ${characterId} — SKINR Licenses`);
    console.log('-'.repeat(60));

    try {
      const owned = await client.cosmetics.getCharacterSkinr(characterId);

      if (owned.licenses.length === 0) {
        console.log('  No SKINR licenses owned.');
      } else {
        const activated = owned.licenses.filter((l) => l.activated);
        const unactivated = owned.licenses.filter((l) => !l.activated);

        console.log(`  Total:       ${owned.licenses.length}`);
        console.log(`  Activated:   ${activated.length}`);
        console.log(`  Unactivated: ${unactivated.length}`);

        if (unactivated.length > 0) {
          console.log('\n  Unactivated licenses (first 5):');
          for (const lic of unactivated.slice(0, 5)) {
            console.log(
              `    ${lic.skinr_id} — ${lic.unactivated} copies available`,
            );
          }
        }
      }

      console.log(`\nCharacter ${characterId} — SKINR Components`);
      console.log('-'.repeat(60));

      const components =
        await client.cosmetics.getCharacterSkinrComponents(characterId);

      if (components.licenses.length === 0) {
        console.log('  No SKINR components owned.');
      } else {
        const byType = new Map<string, number>();
        for (const comp of components.licenses) {
          byType.set(comp.type, (byType.get(comp.type) || 0) + 1);
        }

        console.log(`  Total components: ${components.licenses.length}`);
        for (const [type, count] of byType) {
          console.log(`    ${type.padEnd(14)} ${count}`);
        }
      }
    } catch (err) {
      if (isNotFound(err)) {
        console.log(
          '  Cosmetics endpoints are not currently available on this ESI version.',
        );
      } else {
        throw err;
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
