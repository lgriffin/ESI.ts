import { lineOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the strategy shall have logged at {word} {string} with the context {string}',
  function (level: string, message: string, context: string) {
    expect(lineOf(this, message)).toEqual({
      level,
      context: JSON.parse(context),
    });
  },
);
