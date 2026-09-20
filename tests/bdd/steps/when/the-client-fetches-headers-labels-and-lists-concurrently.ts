import { MAIL_CHARACTER_ID } from '../../support/mail';
import { When } from '../../support/steps';

When(
  'the client fetches headers, labels, and lists concurrently',
  async function () {
    const [headers, labels, lists] = await Promise.all([
      this.client.mail.getMailHeaders(MAIL_CHARACTER_ID),
      this.client.mail.getMailLabels(MAIL_CHARACTER_ID),
      this.client.mail.getMailingLists(MAIL_CHARACTER_ID),
    ]);
    Object.assign(this.values, { headers, labels, lists });
  },
);
