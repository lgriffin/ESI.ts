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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const ACCESS_LIST_ID = 1;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-access-lists-example' });

  try {
    console.log(`Access List #${ACCESS_LIST_ID}\n`);

    const list = await client.accessLists.getAccessList(ACCESS_LIST_ID);

    console.log(`Name:    ${list.name}`);
    console.log(`ID:      ${list.access_list_id}`);
    console.log(`Entries: ${list.entries.length}`);
    console.log('-'.repeat(60));

    // Group entries by entity type
    const byType = new Map<string, typeof list.entries>();
    for (const entry of list.entries) {
      const group = byType.get(entry.entity_type) || [];
      group.push(entry);
      byType.set(entry.entity_type, group);
    }

    for (const [entityType, entries] of byType) {
      console.log(
        `\n${entityType.charAt(0).toUpperCase() + entityType.slice(1)}s (${entries.length})`,
      );
      for (const entry of entries.slice(0, 10)) {
        const icon = entry.access_type === 'allowed' ? '+' : '-';
        console.log(
          `  [${icon}] ${entry.entity_type} ${entry.entity_id} — ${entry.access_type}`,
        );
      }
      if (entries.length > 10)
        console.log(`  ... and ${entries.length - 10} more`);
    }
  } catch (err) {
    if (err instanceof EsiError && err.statusCode === 401) {
      console.error(
        'Authentication required. Set ESI_ACCESS_TOKEN to a valid SSO token.',
      );
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
