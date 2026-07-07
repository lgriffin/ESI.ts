/**
 * ESI.ts Example: Write Operations (Contacts, Fittings, Mail)
 *
 * Demonstrates create → verify → cleanup for reversible write endpoints:
 *  Contacts: addContacts → editContacts → deleteCharacterContacts
 *  Fittings: createFitting → deleteFitting
 *  Mail:     createMailLabel → deleteMailLabel, sendMail → updateMailMetadata → deleteMail
 *
 * REQUIRES AUTHENTICATION with scopes:
 *  - esi-characters.write_contacts.v1
 *  - esi-fittings.read_fittings.v1
 *  - esi-fittings.write_fittings.v1
 *  - esi-mail.organize_mail.v1
 *  - esi-mail.send_mail.v1
 *  - esi-mail.read_mail.v1
 *
 * Usage: npm run example:write-ops
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 90439768;
const TEST_CONTACT_ID = 90404873; // Chribba — a well-known character

async function main() {
  const client = new EsiClient();

  try {
    console.log('Write Operations: Contacts, Fittings & Mail\n');

    // ============================================================
    // CONTACTS: add → edit → delete
    // ============================================================
    console.log('Contacts');
    console.log('='.repeat(50));

    // Add contact
    console.log('\n  Adding contact...');
    try {
      const addResult = await client.contacts.postCharacterContacts(CHARACTER_ID, 5, [TEST_CONTACT_ID]);
      console.log(`    Added: ${JSON.stringify(addResult)}`);

      // Edit contact standing
      console.log('  Editing contact standing...');
      await client.contacts.putCharacterContacts(CHARACTER_ID, 10, [TEST_CONTACT_ID]);
      console.log('    Updated standing to 10');

      // Delete contact
      console.log('  Deleting contact...');
      await client.contacts.deleteCharacterContacts(CHARACTER_ID, [TEST_CONTACT_ID]);
      console.log('    Deleted successfully');

      console.log('  Contacts lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && err.statusCode === 520) {
        console.log('    Contact already exists or conflict — skipping lifecycle');
      } else if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        console.log('    Missing scope — skipped');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // FITTINGS: create → delete
    // ============================================================
    console.log('\nFittings');
    console.log('='.repeat(50));

    try {
      // Create a test fitting (Rifter with 1x 125mm Gatling AutoCannon)
      console.log('\n  Creating test fitting...');
      const fitting = {
        name: 'ESI.ts Test Fit',
        description: 'Automated test fitting — safe to delete',
        ship_type_id: 587, // Rifter
        items: [
          { type_id: 10190, flag: 'HiSlot0', quantity: 1 }, // 125mm Gatling AutoCannon I
        ],
      };
      const createResult = await client.fittings.createFitting(CHARACTER_ID, fitting);
      const fittingId = createResult.fitting_id;
      console.log(`    Created fitting ID: ${fittingId}`);

      // Delete the fitting
      console.log('  Deleting test fitting...');
      await client.fittings.deleteFitting(CHARACTER_ID, fittingId);
      console.log('    Deleted successfully');

      console.log('  Fittings lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        console.log('    Missing scope — skipped');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // MAIL LABELS: create → delete
    // ============================================================
    console.log('\nMail Labels');
    console.log('='.repeat(50));

    try {
      console.log('\n  Creating test label...');
      const labelId = await client.mail.createMailLabel(CHARACTER_ID, {
        name: 'ESI.ts Test Label',
        color: '#660066',
      });
      console.log(`    Created label ID: ${labelId}`);

      console.log('  Deleting test label...');
      await client.mail.deleteMailLabel(CHARACTER_ID, labelId);
      console.log('    Deleted successfully');

      console.log('  Mail labels lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        console.log('    Missing scope — skipped');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // MAIL: send → update metadata → delete
    // ============================================================
    console.log('\nMail Messages');
    console.log('='.repeat(50));

    try {
      console.log('\n  Sending test mail (to self)...');
      const mailId = await client.mail.sendMail(CHARACTER_ID, {
        recipients: [{ recipient_id: CHARACTER_ID, recipient_type: 'character' }],
        subject: 'ESI.ts Write Test',
        body: 'Automated test mail from ESI.ts — safe to delete.',
      });
      console.log(`    Sent mail ID: ${mailId}`);

      console.log('  Updating mail metadata (marking read)...');
      await client.mail.updateMailMetadata(CHARACTER_ID, mailId, {
        read: true,
      });
      console.log('    Marked as read');

      console.log('  Deleting test mail...');
      await client.mail.deleteMail(CHARACTER_ID, mailId);
      console.log('    Deleted successfully');

      console.log('  Mail lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        console.log('    Missing scope — skipped');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // UI: autopilot, info, market, contract, new mail windows
    // ============================================================
    console.log('\nUI Endpoints (require EVE client running)');
    console.log('='.repeat(50));

    // Autopilot waypoint to Jita
    console.log('\n  Setting autopilot to Jita...');
    try {
      await client.ui.setAutopilotWaypoint(30000142, false, true);
      console.log('    Waypoint set');
    } catch (err) {
      if (err instanceof EsiError && [401, 403, 502].includes(err.statusCode ?? 0)) {
        console.log('    Not available (client offline or missing scope)');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open info window for Chribba
    console.log('  Opening info window for Chribba...');
    try {
      await client.ui.openInformationWindow(90404873);
      console.log('    Info window opened');
    } catch (err) {
      if (err instanceof EsiError && [401, 403, 502].includes(err.statusCode ?? 0)) {
        console.log('    Not available (client offline or missing scope)');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open market window for Tritanium
    console.log('  Opening market window for Tritanium...');
    try {
      await client.ui.openMarketDetailsWindow(34);
      console.log('    Market window opened');
    } catch (err) {
      if (err instanceof EsiError && [401, 403, 502].includes(err.statusCode ?? 0)) {
        console.log('    Not available (client offline or missing scope)');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open new mail window
    console.log('  Opening new mail window...');
    try {
      await client.ui.openNewMailWindow({
        recipients: [1689391488],
        subject: 'ESI.ts UI Test',
        body: 'This mail window was opened by ESI.ts!',
      });
      console.log('    Mail compose window opened');
    } catch (err) {
      if (err instanceof EsiError && [401, 403, 502].includes(err.statusCode ?? 0)) {
        console.log('    Not available (client offline or missing scope)');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open contract window
    console.log('  Opening contract window...');
    try {
      await client.ui.openContractWindow(1);
      console.log('    Contract window opened');
    } catch (err) {
      if (err instanceof EsiError && [401, 403, 502].includes(err.statusCode ?? 0)) {
        console.log('    Not available (client offline or missing scope)');
      } else {
        console.log(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('All write operation tests complete.');

  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
