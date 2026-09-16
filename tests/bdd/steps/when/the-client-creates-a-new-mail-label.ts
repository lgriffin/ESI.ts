import { MAIL_CHARACTER_ID, mailFixtures } from '../../support/mail';
import { When } from '../../support/steps';

When('the client creates a new mail label', async function () {
  this.result = await this.client.mail.createMailLabel(
    MAIL_CHARACTER_ID,
    mailFixtures.newLabel(),
  );
});
