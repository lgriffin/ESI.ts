import { EMPTY_INBOX_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When('the client requests their empty inbox headers', async function () {
  this.result = await this.client.mail.getMailHeaders(EMPTY_INBOX_CHARACTER_ID);
});
