/**
 * ESI.ts Example: Corporation History and NPC Corporations
 *
 * Follows a character's employment history, the alliance history and logo of
 * their current corporation, then lists the NPC corporations and the loyalty
 * store offers of one of them.
 *
 * No authentication required.
 *
 * Usage: npm run example:corporation-history
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
const CALDARI_NAVY = 1000035;

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    const history =
      await client.characters.getCharacterCorporationHistory(CHARACTER_ID);
    log.info(`Employment history (${history.length} entries):`);
    for (const entry of history.slice(0, 5)) {
      log.info(`  ${entry.start_date}  corporation ${entry.corporation_id}`);
    }

    const current = [...history].sort((a, b) => b.record_id - a.record_id)[0];
    if (current) {
      const corporationId = current.corporation_id;
      const alliances =
        await client.corporations.getCorporationAllianceHistory(corporationId);
      log.info(
        `\nAlliance history of corporation ${corporationId}: ${alliances.length} entries`,
      );
      for (const entry of alliances.slice(0, 5)) {
        log.info(
          `  ${entry.start_date}  ${entry.alliance_id ?? 'no alliance'}`,
        );
      }

      const icon = await client.corporations.getCorporationIcon(corporationId);
      log.info(`Logo (128px): ${icon.px128x128 ?? 'none'}`);
    }

    const npcCorporations = await client.corporations.getNpcCorporations();
    log.info(`\nNPC corporations: ${npcCorporations.length}`);

    const offers = await client.loyalty.getLoyaltyStoreOffers(CALDARI_NAVY);
    const cheapest = [...offers].sort((a, b) => a.lp_cost - b.lp_cost);
    log.info(`Caldari Navy LP store: ${offers.length} offers, cheapest:`);
    for (const offer of cheapest.slice(0, 5)) {
      log.info(
        `  ${offer.quantity} x type ${offer.type_id}: ${offer.lp_cost} LP + ${offer.isk_cost.toLocaleString()} ISK`,
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
