/**
 * ESI.ts Example: Mail Inbox
 *
 * Demonstrates character mail operations: reading inbox headers, viewing
 * mail labels, listing mailing lists, and reading individual messages.
 * Also shows the available write operations (send, delete, label management).
 *
 * REQUIRES AUTHENTICATION — set ESI_ACCESS_TOKEN in your environment.
 *
 * ESI Scopes Required:
 *   - esi-mail.read_mail.v1        (read mail headers, body, labels, mailing lists)
 *   - esi-mail.send_mail.v1        (send mail — shown but not executed)
 *   - esi-mail.organize_mail.v1    (delete mail, manage labels — shown but not executed)
 *
 * Usage: npm run example:mail
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
    clientId: 'esi-ts-mail-demo',
  });

  try {
    log.info('Mail Inbox\n');

    // Fetch inbox headers, labels, and mailing lists in parallel
    // Scope: esi-mail.read_mail.v1
    log.info('Fetching mail data...');
    const [headers, labelsData, mailingLists] = await Promise.all([
      client.mail.getMailHeaders(CHARACTER_ID),
      client.mail.getMailLabels(CHARACTER_ID),
      client.mail.getMailingLists(CHARACTER_ID),
    ]);

    // Labels and unread count
    log.info('Mail Labels');
    log.info('-'.repeat(40));
    if (labelsData.total_unread_count !== undefined) {
      log.info(`  Total unread: ${labelsData.total_unread_count}`);
    }
    if (labelsData.labels && labelsData.labels.length > 0) {
      for (const label of labelsData.labels) {
        const unread = label.unread_count
          ? ` (${label.unread_count} unread)`
          : '';
        log.info(`  [${label.label_id}] ${label.name}${unread}`);
      }
    } else {
      log.info('  No custom labels');
    }

    // Mailing lists
    log.info(`\nMailing Lists (${mailingLists.length})`);
    log.info('-'.repeat(40));
    if (mailingLists.length === 0) {
      log.info('  Not subscribed to any mailing lists');
    } else {
      for (const list of mailingLists) {
        log.info(`  [${list.mailing_list_id}] ${list.name}`);
      }
    }

    // Inbox headers
    log.info(`\nInbox (${headers.length} messages)`);
    log.info('-'.repeat(40));
    if (headers.length === 0) {
      log.info('  Inbox is empty');
    } else {
      const recent = headers.slice(0, 10);
      for (const mail of recent) {
        const date = mail.timestamp
          ? new Date(mail.timestamp).toLocaleDateString()
          : 'unknown';
        const read = mail.is_read ? ' ' : '*';
        log.info(
          `  ${read} ${date} | From ${mail.from || 'unknown'} | ${mail.subject || '(no subject)'}`,
        );
      }
      if (headers.length > 10) {
        log.info(`  ... and ${headers.length - 10} more messages`);
      }

      // Read the first mail's full body
      // Scope: esi-mail.read_mail.v1
      if (recent[0]?.mail_id) {
        log.info(`\nReading mail #${recent[0].mail_id}...`);
        log.info('-'.repeat(40));
        try {
          const fullMail = await client.mail.getMail(
            CHARACTER_ID,
            recent[0].mail_id,
          );
          log.info(`  Subject: ${fullMail.subject || '(no subject)'}`);
          log.info(`  From:    ${fullMail.from}`);
          if (fullMail.body) {
            let stripped = fullMail.body;
            let prev = '';
            while (prev !== stripped) {
              prev = stripped;
              stripped = stripped.replace(/<[^>]*?>/g, '');
            }
            const preview = stripped.substring(0, 200);
            log.info(
              `  Body:    ${preview}${stripped.length > 200 ? '...' : ''}`,
            );
          }
        } catch {
          log.info('  Could not read mail body');
        }
      }
    }

    // Write operations available but not executed:
    // client.mail.sendMail(characterId, { recipients, subject, body })  — Scope: esi-mail.send_mail.v1
    // client.mail.deleteMail(characterId, mailId)                       — Scope: esi-mail.organize_mail.v1
    // client.mail.createMailLabel(characterId, { name, color })          — Scope: esi-mail.organize_mail.v1
    // client.mail.deleteMailLabel(characterId, labelId)                  — Scope: esi-mail.organize_mail.v1
    // client.mail.updateMailMetadata(characterId, mailId, { read, labels }) — Scope: esi-mail.organize_mail.v1
    log.info(
      '\nNote: write operations (sendMail, deleteMail, createMailLabel) require additional scopes',
    );
  } catch (err) {
    if (
      err instanceof EsiError &&
      (err.statusCode === 401 || err.statusCode === 403)
    ) {
      log.error(
        'Authentication required. Set ESI_ACCESS_TOKEN with scope esi-mail.read_mail.v1',
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
