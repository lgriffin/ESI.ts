import { MAIL_CHARACTER_ID, MAIL_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests the full mail', async function () {
  this.result = await this.client.mail.getMail(MAIL_CHARACTER_ID, MAIL_ID);
});
