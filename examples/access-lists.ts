/**
 * ESI.ts Example: Access Lists
 *
 * Retrieves an access list (ACL) and displays its entries
 * grouped by entity type. Requires ESI authentication.
 *
 * Usage: npm run example:access-lists
 *
 * Environment:
 *   ESI_ACCESS_TOKEN — a valid SSO token with the access-lists scope
 *
 * @nightly auth
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';
import { createConsoleLogger } from '../src';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

const CHARACTER_ID = 90439768;
const ACCESS_LIST_ID = 1;

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-access-lists-example',
  });

  try {
    log.info(`Access List #${ACCESS_LIST_ID}\n`);

    const list = await client.accessLists.getAccessList(
      CHARACTER_ID,
      ACCESS_LIST_ID,
    );

    log.info(`Name:    ${list.name}`);
    log.info(`ID:      ${list.access_list_id}`);
    log.info(`Entries: ${list.entries.length}`);
    log.info('-'.repeat(60));

    // Group entries by entity type
    const byType = new Map<string, typeof list.entries>();
    for (const entry of list.entries) {
      const group = byType.get(entry.entity_type) || [];
      group.push(entry);
      byType.set(entry.entity_type, group);
    }

    for (const [entityType, entries] of byType) {
      log.info(
        `\n${entityType.charAt(0).toUpperCase() + entityType.slice(1)}s (${entries.length})`,
      );
      for (const entry of entries.slice(0, 10)) {
        const icon = entry.access_type === 'allowed' ? '+' : '-';
        log.info(
          `  [${icon}] ${entry.entity_type} ${entry.entity_id} — ${entry.access_type}`,
        );
      }
      if (entries.length > 10)
        log.info(`  ... and ${entries.length - 10} more`);
    }
  } catch (err) {
    if (err instanceof EsiError && err.statusCode === 401) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN to a valid SSO token.',
      );
    } else {
      log.error('Request failed', { error: err });
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
