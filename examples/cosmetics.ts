/**
 * ESI.ts Example: SKINR Cosmetics
 *
 * Looks up SKINR designs and a character's owned licenses and components.
 * The public getSkinr endpoint works without auth; the character endpoints
 * require an ESI token with the esi.cosmetic.char:read scope.
 *
 * Usage: npm run example:cosmetics
 *
 * @nightly mixed
 */
import { EsiClient } from '../src/EsiClient';
import { isNotFound } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

async function main() {
  const client = new EsiClient({ logger: esiLog });

  const skinrId = process.env.SKINR_ID || '';
  const characterId = parseInt(process.env.CHARACTER_ID || '0', 10);

  try {
    log.info('SKINR Cosmetics\n');

    if (skinrId) {
      log.info(`Looking up SKINR design: ${skinrId}`);
      log.info('-'.repeat(60));

      try {
        const skinr = await client.cosmetics.getSkinr(skinrId);
        log.info(`  Name:       ${skinr.name}`);
        log.info(`  Creator:    ${skinr.creator_id}`);
        log.info(`  Ship Type:  ${skinr.ship_type_id}`);
        log.info(`  Tier:       ${skinr.tier.level}`);
        if (skinr.line) {
          log.info(`  Line:       ${skinr.line}`);
        }
        log.info(`  Blend Mode: ${skinr.layout.pattern_blend_mode}`);
        log.info(`  Slots:      ${skinr.layout.slots.length}`);
      } catch (err) {
        if (isNotFound(err)) {
          log.info(`  SKINR design '${skinrId}' not found.`);
        } else {
          throw err;
        }
      }
      log.info('');
    } else {
      log.info(
        'Set SKINR_ID environment variable to look up a specific design.\n',
      );
    }

    if (!characterId) {
      log.info(
        'Set CHARACTER_ID environment variable to view owned licenses and components.',
      );
      return;
    }

    log.info(`Character ${characterId} — SKINR Licenses`);
    log.info('-'.repeat(60));

    try {
      const owned = await client.cosmetics.getCharacterSkinr(characterId);

      if (owned.licenses.length === 0) {
        log.info('  No SKINR licenses owned.');
      } else {
        const activated = owned.licenses.filter((l) => l.activated);
        const unactivated = owned.licenses.filter((l) => !l.activated);

        log.info(`  Total:       ${owned.licenses.length}`);
        log.info(`  Activated:   ${activated.length}`);
        log.info(`  Unactivated: ${unactivated.length}`);

        if (unactivated.length > 0) {
          log.info('\n  Unactivated licenses (first 5):');
          for (const lic of unactivated.slice(0, 5)) {
            log.info(
              `    ${lic.skinr_id} — ${lic.unactivated} copies available`,
            );
          }
        }
      }

      log.info(`\nCharacter ${characterId} — SKINR Components`);
      log.info('-'.repeat(60));

      const components =
        await client.cosmetics.getCharacterSkinrComponents(characterId);

      if (components.licenses.length === 0) {
        log.info('  No SKINR components owned.');
      } else {
        const byType = new Map<string, number>();
        for (const comp of components.licenses) {
          byType.set(comp.type, (byType.get(comp.type) || 0) + 1);
        }

        log.info(`  Total components: ${components.licenses.length}`);
        for (const [type, count] of byType) {
          log.info(`    ${type.padEnd(14)} ${count}`);
        }
      }
    } catch (err) {
      if (isNotFound(err)) {
        log.info(
          '  Cosmetics endpoints are not currently available on this ESI version.',
        );
      } else {
        throw err;
      }
    }
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
