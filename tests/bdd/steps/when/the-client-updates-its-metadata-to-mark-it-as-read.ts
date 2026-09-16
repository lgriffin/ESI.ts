import { MAIL_CHARACTER_ID, MAIL_ID, mailFixtures } from '../../support/mail';
import { When } from '../../support/steps';

When('the client updates its metadata to mark it as read', async function () {
  await this.client.mail.updateMailMetadata(
    MAIL_CHARACTER_ID,
    MAIL_ID,
    mailFixtures.readMetadata(),
  );
});
