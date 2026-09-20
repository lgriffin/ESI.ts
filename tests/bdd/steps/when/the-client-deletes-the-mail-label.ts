import { CUSTOM_LABEL_ID, MAIL_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client deletes the mail label', async function () {
  await this.client.mail.deleteMailLabel(MAIL_CHARACTER_ID, CUSTOM_LABEL_ID);
});
