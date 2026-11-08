import { contextOfLine, loggedLines } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the cache logger shall have received the info line {string} with the context {string}',
  function (message: string, context: string) {
    expect(loggedLines(this)).toContain(`info ${message}`);
    expect(contextOfLine(this, message)).toEqual(JSON.parse(context));
  },
);
