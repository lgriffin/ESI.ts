/**
 * ESI.ts Example: Contact Management
 *
 * Demonstrates reading character contacts with standings and labels,
 * and shows the available write operations (add, edit, delete contacts).
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-characters.read_contacts.v1  (read character contacts + labels)
 *   - esi-characters.write_contacts.v1 (add/edit/delete contacts — shown but not executed)
 *
 * Usage: npm run example:contacts
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

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({
    logger: esiLog,
    clientId: 'esi-ts-contacts-demo',
  });

  try {
    log.info('Contact Management\n');

    // Fetch contacts and labels in parallel
    // Scope: esi-characters.read_contacts.v1
    log.info('Fetching contacts and labels...\n');
    const [contacts, labels] = await Promise.all([
      client.contacts.getCharacterContacts(CHARACTER_ID),
      client.contacts.getCharacterContactLabels(CHARACTER_ID),
    ]);

    // Labels
    log.info(`Contact Labels (${labels.length})`);
    log.info('-'.repeat(40));
    if (labels.length === 0) {
      log.info('  No custom labels');
    } else {
      for (const label of labels) {
        log.info(`  [${label.label_id}] ${label.label_name}`);
      }
    }

    // Contact list
    log.info(`\nContacts (${contacts.length})`);
    log.info('-'.repeat(40));
    if (contacts.length === 0) {
      log.info('  No contacts');
    } else {
      // Group by standing
      const standingGroups = new Map<string, typeof contacts>([
        ['Excellent (+10)', []],
        ['Good (+5)', []],
        ['Neutral (0)', []],
        ['Bad (-5)', []],
        ['Terrible (-10)', []],
      ]);

      for (const c of contacts) {
        if (c.standing >= 10) standingGroups.get('Excellent (+10)')!.push(c);
        else if (c.standing > 0) standingGroups.get('Good (+5)')!.push(c);
        else if (c.standing === 0) standingGroups.get('Neutral (0)')!.push(c);
        else if (c.standing > -10) standingGroups.get('Bad (-5)')!.push(c);
        else standingGroups.get('Terrible (-10)')!.push(c);
      }

      for (const [group, members] of standingGroups) {
        if (members.length > 0) {
          log.info(
            `\n  ${group}: ${members.length} contact${members.length > 1 ? 's' : ''}`,
          );
          for (const c of members.slice(0, 5)) {
            const type = c.contact_type || 'unknown';
            const labelIds = c.label_ids?.join(', ') || 'none';
            log.info(
              `    ${type} ${c.contact_id} | standing ${c.standing} | labels: ${labelIds}`,
            );
          }
          if (members.length > 5) {
            log.info(`    ... and ${members.length - 5} more`);
          }
        }
      }

      // Summary by contact type
      const byType = new Map<string, number>();
      for (const c of contacts) {
        const type = c.contact_type || 'unknown';
        byType.set(type, (byType.get(type) || 0) + 1);
      }

      log.info('\n  By Contact Type:');
      for (const [type, count] of byType) {
        log.info(`    ${type}: ${count}`);
      }
    }

    // Write operations available but not executed:
    // client.contacts.postCharacterContacts(characterId, { ... })      — Scope: esi-characters.write_contacts.v1
    // client.contacts.putCharacterContacts(characterId, { ... })       — Scope: esi-characters.write_contacts.v1
    // client.contacts.deleteCharacterContacts(characterId, [ids])      — Scope: esi-characters.write_contacts.v1
    log.info(
      '\nNote: write operations (add/edit/delete contacts) require scope esi-characters.write_contacts.v1',
    );
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-characters.read_contacts.v1',
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
