import { Then } from '../../support/steps';
import { sdeErrorOf } from '../../support/sdeFiles';

Then(
  'the call shall fail with an SDE error naming {string}',
  function (text: string) {
    expect(sdeErrorOf(this).message).toContain(text);
  },
);
