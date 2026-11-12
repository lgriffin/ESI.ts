/**
 * ESI.ts Example: Access Lists
 *
 * Lists the character's access lists (ACLs), then retrieves the first one
 * and displays its members grouped by entity type. Requires ESI
 * authentication.
 *
 * Usage: npm run example:access-lists
 *
 * Environment:
 *   ESI_ACCESS_TOKEN — a valid SSO token with the access-lists scope
 *
 * @nightly auth
 */
import { EsiClient, createConsoleLogger } from '../src';
import { EsiError } from '../src/errors';
import { exampleCharacterId } from './support/character';

// The program's own output. The client logs through the same console sink
// at ESI_LOG_LEVEL (default warn), so its diagnostics stay out of the way.
const log = createConsoleLogger('info');
const esiLog = createConsoleLogger();

// ESI_CHARACTER_ID, else the token's own character (examples/support/character.ts).
const CHARACTER_ID = exampleCharacterId();

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-access-lists-example',
  });

  try {
    const { access_lists: lists } =
      await client.accessLists.getCharacterAccessLists(CHARACTER_ID);
    log.info(`Access lists: ${lists.length}`);
    const first = lists[0];
    if (!first) {
      log.info('This character has no access lists.');
      return;
    }
    log.info(`Access List #${first.id}\n`);

    const list = await client.accessLists.getAccessList(CHARACTER_ID, first.id);

    const { membership } = list;
    log.info(`Name:           ${list.name}`);
    log.info(`ID:             ${list.id}`);
    log.info(`Description:    ${list.description}`);
    log.info(`Allow everyone: ${membership.allow_everyone ? 'yes' : 'no'}`);
    log.info('-'.repeat(60));

    const groups: Array<[string, Array<{ id: number; access: string }>]> = [
      [
        'Characters',
        membership.characters.map((m) => ({
          id: m.character_id,
          access: m.access,
        })),
      ],
      [
        'Corporations',
        membership.corporations.map((m) => ({
          id: m.corporation_id,
          access: m.access,
        })),
      ],
      [
        'Alliances',
        membership.alliances.map((m) => ({
          id: m.alliance_id,
          access: m.access,
        })),
      ],
    ];

    for (const [label, members] of groups) {
      if (members.length === 0) continue;
      log.info(`\n${label} (${members.length})`);
      for (const member of members.slice(0, 10)) {
        const icon = member.access === 'Blocked' ? '-' : '+';
        log.info(`  [${icon}] ${member.id} — ${member.access}`);
      }
      if (members.length > 10)
        log.info(`  ... and ${members.length - 10} more`);
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
