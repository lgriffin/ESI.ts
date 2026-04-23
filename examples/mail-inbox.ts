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
 */
import { EsiClient } from '../src/EsiClient';
import { EsiError } from '../src/core/util/error';

const CHARACTER_ID = 1689391488;

async function main() {
  const client = new EsiClient({ clientId: 'esi-ts-mail-demo' });

  try {
    console.log('Mail Inbox\n');

    // Fetch inbox headers, labels, and mailing lists in parallel
    // Scope: esi-mail.read_mail.v1
    console.log('Fetching mail data...');
    const [headers, labelsData, mailingLists] = await Promise.all([
      client.mail.getMailHeaders(CHARACTER_ID),
      client.mail.getMailLabels(CHARACTER_ID),
      client.mail.getMailingLists(CHARACTER_ID),
    ]);

    // Labels and unread count
    console.log('Mail Labels');
    console.log('-'.repeat(40));
    if (labelsData.total_unread_count !== undefined) {
      console.log(`  Total unread: ${labelsData.total_unread_count}`);
    }
    if (labelsData.labels && labelsData.labels.length > 0) {
      for (const label of labelsData.labels) {
        const unread = label.unread_count ? ` (${label.unread_count} unread)` : '';
        console.log(`  [${label.label_id}] ${label.name}${unread}`);
      }
    } else {
      console.log('  No custom labels');
    }

    // Mailing lists
    console.log(`\nMailing Lists (${mailingLists.length})`);
    console.log('-'.repeat(40));
    if (mailingLists.length === 0) {
      console.log('  Not subscribed to any mailing lists');
    } else {
      for (const list of mailingLists) {
        console.log(`  [${list.mailing_list_id}] ${list.name}`);
      }
    }

    // Inbox headers
    console.log(`\nInbox (${headers.length} messages)`);
    console.log('-'.repeat(40));
    if (headers.length === 0) {
      console.log('  Inbox is empty');
    } else {
      const recent = headers.slice(0, 10);
      for (const mail of recent) {
        const date = mail.timestamp ? new Date(mail.timestamp).toLocaleDateString() : 'unknown';
        const read = mail.is_read ? ' ' : '*';
        console.log(`  ${read} ${date} | From ${mail.from || 'unknown'} | ${mail.subject || '(no subject)'}`);
      }
      if (headers.length > 10) {
        console.log(`  ... and ${headers.length - 10} more messages`);
      }

      // Read the first mail's full body
      // Scope: esi-mail.read_mail.v1
      if (recent[0]?.mail_id) {
        console.log(`\nReading mail #${recent[0].mail_id}...`);
        console.log('-'.repeat(40));
        try {
          const fullMail = await client.mail.getMail(CHARACTER_ID, recent[0].mail_id);
          console.log(`  Subject: ${fullMail.subject || '(no subject)'}`);
          console.log(`  From:    ${fullMail.from}`);
          if (fullMail.body) {
            const preview = fullMail.body.substring(0, 200).replace(/<[^>]*>/g, '');
            console.log(`  Body:    ${preview}${fullMail.body.length > 200 ? '...' : ''}`);
          }
        } catch {
          console.log('  Could not read mail body');
        }
      }
    }

    // Write operations available but not executed:
    // client.mail.sendMail(characterId, { recipients, subject, body })  — Scope: esi-mail.send_mail.v1
    // client.mail.deleteMail(characterId, mailId)                       — Scope: esi-mail.organize_mail.v1
    // client.mail.createMailLabel(characterId, { name, color })          — Scope: esi-mail.organize_mail.v1
    // client.mail.deleteMailLabel(characterId, labelId)                  — Scope: esi-mail.organize_mail.v1
    // client.mail.updateMailMetadata(characterId, mailId, { read, labels }) — Scope: esi-mail.organize_mail.v1
    console.log('\nNote: write operations (sendMail, deleteMail, createMailLabel) require additional scopes');

  } catch (err) {
    if (err instanceof EsiError && (err.statusCode === 401 || err.statusCode === 403)) {
      console.error('Authentication required. Set ESI_ACCESS_TOKEN with scope esi-mail.read_mail.v1');
    } else {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    process.exit(1);
  } finally {
    await client.shutdown();
  }
}

main();
