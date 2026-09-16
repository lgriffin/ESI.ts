import { MAIL_CHARACTER_ID, mailFixtures } from '../../support/mail';
import { When } from '../../support/steps';

When('the client sends a mail to another character', async function () {
  this.result = await this.client.mail.sendMail(
    MAIL_CHARACTER_ID,
    mailFixtures.outgoingMail(),
  );
});
