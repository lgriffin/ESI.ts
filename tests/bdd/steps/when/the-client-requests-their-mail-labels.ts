import { MAIL_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests their mail labels', async function () {
  this.result = await this.client.mail.getMailLabels(MAIL_CHARACTER_ID);
});
