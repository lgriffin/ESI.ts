import { lineOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the client shall have logged at {word} {string}',
  function (level: string, message: string) {
    expect(lineOf(this, message)).toEqual({ level, context: undefined });
  },
);
