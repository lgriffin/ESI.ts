import { loggedMessages } from '../../support/client-construction';
import { Then } from '../../support/steps';

Then('the client shall not have logged {string}', function (message: string) {
  expect(loggedMessages(this)).not.toContain(message);
});
