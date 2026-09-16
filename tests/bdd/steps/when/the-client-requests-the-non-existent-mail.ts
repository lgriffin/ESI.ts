import { MAIL_CHARACTER_ID, UNKNOWN_MAIL_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests the non-existent mail', async function () {
  try {
    await this.client.mail.getMail(MAIL_CHARACTER_ID, UNKNOWN_MAIL_ID);
  } catch (error) {
    this.error = error;
  }
});
