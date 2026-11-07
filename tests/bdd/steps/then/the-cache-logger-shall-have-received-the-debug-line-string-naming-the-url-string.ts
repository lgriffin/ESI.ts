import { contextOfLine, loggedLines } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the cache logger shall have received the debug line {string} naming the URL {string}',
  function (message: string, url: string) {
    expect(loggedLines(this)).toContain(`debug ${message}`);
    expect(contextOfLine(this, message)).toEqual({ url });
  },
);
