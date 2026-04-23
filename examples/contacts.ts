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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-contacts-demo' });

  try {
    console.log('Contact Management\n');

    // Fetch contacts and labels in parallel
    // Scope: esi-characters.read_contacts.v1
    console.log('Fetching contacts and labels...\n');
    const [contacts, labels] = await Promise.all([
      client.contacts.getCharacterContacts(CHARACTER_ID),
      client.contacts.getCharacterContactLabels(CHARACTER_ID),
    ]);

    // Labels
    console.log(`Contact Labels (${labels.length})`);
    console.log('-'.repeat(40));
    if (labels.length === 0) {
      console.log('  No custom labels');
    } else {
      for (const label of labels) {
        console.log(`  [${label.label_id}] ${label.label_name}`);
      }
    }

    // Contact list
    console.log(`\nContacts (${contacts.length})`);
    console.log('-'.repeat(40));
    if (contacts.length === 0) {
      console.log('  No contacts');
    } else {
      // Group by standing
      const standingGroups: Record<string, typeof contacts> = {
        'Excellent (+10)': [],
        'Good (+5)': [],
        'Neutral (0)': [],
        'Bad (-5)': [],
        'Terrible (-10)': [],
      };

      for (const c of contacts) {
        if (c.standing >= 10) standingGroups['Excellent (+10)'].push(c);
        else if (c.standing > 0) standingGroups['Good (+5)'].push(c);
        else if (c.standing === 0) standingGroups['Neutral (0)'].push(c);
        else if (c.standing > -10) standingGroups['Bad (-5)'].push(c);
        else standingGroups['Terrible (-10)'].push(c);
      }

      for (const [group, members] of Object.entries(standingGroups)) {
        if (members.length > 0) {
          console.log(`\n  ${group}: ${members.length} contact${members.length > 1 ? 's' : ''}`);
          for (const c of members.slice(0, 5)) {
            const type = c.contact_type || 'unknown';
            const labelIds = c.label_ids?.join(', ') || 'none';
            console.log(`    ${type} ${c.contact_id} | standing ${c.standing} | labels: ${labelIds}`);
          }
          if (members.length > 5) {
            console.log(`    ... and ${members.length - 5} more`);
          }
        }
      }

      // Summary by contact type
      const byType = new Map<string, number>();
      for (const c of contacts) {
        const type = c.contact_type || 'unknown';
        byType.set(type, (byType.get(type) || 0) + 1);
      }

      console.log('\n  By Contact Type:');
      for (const [type, count] of byType) {
        console.log(`    ${type}: ${count}`);
      }
    }

    // Write operations available but not executed:
    // client.contacts.postCharacterContacts(characterId, { ... })      — Scope: esi-characters.write_contacts.v1
    // client.contacts.putCharacterContacts(characterId, { ... })       — Scope: esi-characters.write_contacts.v1
    // client.contacts.deleteCharacterContacts(characterId, [ids])      — Scope: esi-characters.write_contacts.v1
    console.log('\nNote: write operations (add/edit/delete contacts) require scope esi-characters.write_contacts.v1');

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scope esi-characters.read_contacts.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
