import { lineOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the deduplicator shall have logged at debug {string}',
  function (message: string) {
    expect(lineOf(this, message)).toEqual({
      level: 'debug',
      context: undefined,
    });
  },
);
