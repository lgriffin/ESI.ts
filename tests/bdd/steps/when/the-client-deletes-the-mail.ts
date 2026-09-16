import { MAIL_CHARACTER_ID, MAIL_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client deletes the mail', async function () {
  await this.client.mail.deleteMail(MAIL_CHARACTER_ID, MAIL_ID);
});
