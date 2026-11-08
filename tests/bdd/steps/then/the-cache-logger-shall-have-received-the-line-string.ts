import { contextOfLine, loggedLines } from '../../support/cache-components';
import { Then } from '../../support/steps';

Then(
  'the cache logger shall have received the line {string}',
  function (line: string) {
    expect(loggedLines(this)).toContain(line);
    const message = line.slice(line.indexOf(' ') + 1);
    expect(contextOfLine(this, message)).toBeUndefined();
  },
);
