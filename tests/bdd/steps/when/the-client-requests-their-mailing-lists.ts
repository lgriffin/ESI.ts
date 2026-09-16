import { MAIL_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests their mailing lists', async function () {
  this.result = await this.client.mail.getMailingLists(MAIL_CHARACTER_ID);
});
