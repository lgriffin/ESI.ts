import { loggedContext } from '../../support/client-construction';
import { Then } from '../../support/steps';

Then(
  'the client shall have logged {string} with the context {string}',
  function (message: string, context: string) {
    expect(loggedContext(this, message)).toEqual(JSON.parse(context));
  },
);
