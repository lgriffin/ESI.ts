import { MAIL_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests mail headers without auth', async function () {
  try {
    await this.client.mail.getMailHeaders(MAIL_CHARACTER_ID);
  } catch (error) {
    this.error = error;
  }
});
