import { loggedContext } from '../../support/client-construction';
import { Then } from '../../support/steps';

Then(
  'the client shall have logged {string} with no context',
  function (message: string) {
    expect(loggedContext(this, message)).toBeUndefined();
  },
);
