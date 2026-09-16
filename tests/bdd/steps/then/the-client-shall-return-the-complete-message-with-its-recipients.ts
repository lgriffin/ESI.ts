import { MAIL_CHARACTER_ID, MAIL_ID, mailPaths } from '../../support/mail';
import { lastRequest } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client shall return the complete message with its recipients',
  function () {
    expect(lastRequest().url.pathname).toBe(
      mailPaths.mail(MAIL_CHARACTER_ID, MAIL_ID),
    );
    expect(this.result.mail_id).toBe(MAIL_ID);
    expect(this.result.subject).toBe('Fleet Operation Tonight');
    expect(this.result.from).toBe(123456789);
    expect(this.result.recipients).toEqual([
      { recipient_id: MAIL_CHARACTER_ID, recipient_type: 'character' },
      { recipient_id: 99005338, recipient_type: 'alliance' },
    ]);
  },
);
