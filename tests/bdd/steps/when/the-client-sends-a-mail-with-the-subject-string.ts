import { captureOutcome } from '../../support/outcome';
import { When } from '../../support/steps';

When(
  'the client sends a mail with the subject {string}',
  async function (subject: string) {
    await captureOutcome(this, () =>
      this.client.mail.sendMail(2112625428, {
        recipients: [{ recipient_id: 90000001, recipient_type: 'character' }],
        subject,
        body: 'Form up in Jita.',
      }),
    );
  },
);
