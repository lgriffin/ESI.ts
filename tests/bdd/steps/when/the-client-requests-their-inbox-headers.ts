import { MAIL_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests their inbox headers', async function () {
  this.result = await this.client.mail.getMailHeaders(MAIL_CHARACTER_ID);
});
