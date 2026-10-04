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
const TEST_CONTACT_ID = 90404873; // Chribba — a well-known character

async function main() {
  const client = new EsiClient({ logger: esiLog });

  try {
    log.info('Write Operations: Contacts, Fittings & Mail\n');

    // ============================================================
    // CONTACTS: add → edit → delete
    // ============================================================
    log.info('Contacts');
    log.info('='.repeat(50));

    // Add contact
    log.info('\n  Adding contact...');
    try {
      const addResult = await client.contacts.postCharacterContacts(
        CHARACTER_ID,
        5,
        [TEST_CONTACT_ID],
      );
      log.info(`    Added: ${JSON.stringify(addResult)}`);

      // Edit contact standing
      log.info('  Editing contact standing...');
      await client.contacts.putCharacterContacts(CHARACTER_ID, 10, [
        TEST_CONTACT_ID,
      ]);
      log.info('    Updated standing to 10');

      // Delete contact
      log.info('  Deleting contact...');
      await client.contacts.deleteCharacterContacts(CHARACTER_ID, [
        TEST_CONTACT_ID,
      ]);
      log.info('    Deleted successfully');

      log.info('  Contacts lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && err.statusCode === 520) {
        log.info('    Contact already exists or conflict — skipping lifecycle');
      } else if (
        err instanceof EsiError &&
        [401, 403].includes(err.statusCode ?? 0)
      ) {
        log.info('    Missing scope — skipped');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // FITTINGS: create → delete
    // ============================================================
    log.info('\nFittings');
    log.info('='.repeat(50));

    try {
      // Create a test fitting (Rifter with 1x 125mm Gatling AutoCannon)
      log.info('\n  Creating test fitting...');
      const fitting = {
        name: 'ESI.ts Test Fit',
        description: 'Automated test fitting — safe to delete',
        ship_type_id: 587, // Rifter
        items: [
          { type_id: 10190, flag: 'HiSlot0', quantity: 1 }, // 125mm Gatling AutoCannon I
        ],
      };
      const createResult = await client.fittings.createFitting(
        CHARACTER_ID,
        fitting,
      );
      const fittingId = createResult.fitting_id;
      log.info(`    Created fitting ID: ${fittingId}`);

      // Delete the fitting
      log.info('  Deleting test fitting...');
      await client.fittings.deleteFitting(CHARACTER_ID, fittingId);
      log.info('    Deleted successfully');

      log.info('  Fittings lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        log.info('    Missing scope — skipped');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // MAIL LABELS: create → delete
    // ============================================================
    log.info('\nMail Labels');
    log.info('='.repeat(50));

    try {
      log.info('\n  Creating test label...');
      const labelId = await client.mail.createMailLabel(CHARACTER_ID, {
        name: 'ESI.ts Test Label',
        color: '#660066',
      });
      log.info(`    Created label ID: ${labelId}`);

      log.info('  Deleting test label...');
      await client.mail.deleteMailLabel(CHARACTER_ID, labelId);
      log.info('    Deleted successfully');

      log.info('  Mail labels lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        log.info('    Missing scope — skipped');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // MAIL: send → update metadata → delete
    // ============================================================
    log.info('\nMail Messages');
    log.info('='.repeat(50));

    try {
      log.info('\n  Sending test mail (to self)...');
      const mailId = await client.mail.sendMail(CHARACTER_ID, {
        recipients: [
          { recipient_id: CHARACTER_ID, recipient_type: 'character' },
        ],
        subject: 'ESI.ts Write Test',
        body: 'Automated test mail from ESI.ts — safe to delete.',
      });
      log.info(`    Sent mail ID: ${mailId}`);

      log.info('  Updating mail metadata (marking read)...');
      await client.mail.updateMailMetadata(CHARACTER_ID, mailId, {
        read: true,
      });
      log.info('    Marked as read');

      log.info('  Deleting test mail...');
      await client.mail.deleteMail(CHARACTER_ID, mailId);
      log.info('    Deleted successfully');

      log.info('  Mail lifecycle: PASS');
    } catch (err) {
      if (err instanceof EsiError && [401, 403].includes(err.statusCode ?? 0)) {
        log.info('    Missing scope — skipped');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // ============================================================
    // UI: autopilot, info, market, contract, new mail windows
    // ============================================================
    log.info('\nUI Endpoints (require EVE client running)');
    log.info('='.repeat(50));

    // Autopilot waypoint to Rens
    log.info('\n  Setting autopilot to Rens...');
    try {
      await client.ui.setAutopilotWaypoint(30002510, false, true);
      log.info('    Waypoint set');
    } catch (err) {
      if (
        err instanceof EsiError &&
        [401, 403, 502].includes(err.statusCode ?? 0)
      ) {
        log.info('    Not available (client offline or missing scope)');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open info window for Chribba
    log.info('  Opening info window for Chribba...');
    try {
      await client.ui.openInformationWindow(90404873);
      log.info('    Info window opened');
    } catch (err) {
      if (
        err instanceof EsiError &&
        [401, 403, 502].includes(err.statusCode ?? 0)
      ) {
        log.info('    Not available (client offline or missing scope)');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open market window for Tritanium
    log.info('  Opening market window for Tritanium...');
    try {
      await client.ui.openMarketDetailsWindow(34);
      log.info('    Market window opened');
    } catch (err) {
      if (
        err instanceof EsiError &&
        [401, 403, 502].includes(err.statusCode ?? 0)
      ) {
        log.info('    Not available (client offline or missing scope)');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open new mail window
    log.info('  Opening new mail window...');
    try {
      await client.ui.openNewMailWindow({
        recipients: [1689391488],
        subject: 'ESI.ts UI Test',
        body: 'This mail window was opened by ESI.ts!',
      });
      log.info('    Mail compose window opened');
    } catch (err) {
      if (
        err instanceof EsiError &&
        [401, 403, 502].includes(err.statusCode ?? 0)
      ) {
        log.info('    Not available (client offline or missing scope)');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    // Open contract window
    log.info('  Opening contract window...');
    try {
      await client.ui.openContractWindow(1);
      log.info('    Contract window opened');
    } catch (err) {
      if (
        err instanceof EsiError &&
        [401, 403, 502].includes(err.statusCode ?? 0)
      ) {
        log.info('    Not available (client offline or missing scope)');
      } else {
        log.info(`    Error: ${err instanceof Error ? err.message : err}`);
      }
    }

    log.info('\n' + '='.repeat(50));
    log.info('All write operation tests complete.');
  } catch (err) {
    log.error('Request failed', { error: err });
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
