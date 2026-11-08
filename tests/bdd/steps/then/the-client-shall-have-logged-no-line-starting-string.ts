import { hasLineStarting } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the client shall have logged no line starting {string}',
  function (prefix: string) {
    expect(hasLineStarting(this, prefix)).toBe(false);
  },
);
