import { loggedMessages } from '../../support/client-construction';
import { Then } from '../../support/steps';

Then('the client shall have logged {string}', function (message: string) {
  expect(loggedMessages(this)).toContain(message);
});
