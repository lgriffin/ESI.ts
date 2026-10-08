import { SdeDatabaseError } from '../../../../src/sde/errors';
import { Then } from '../../support/steps';

Then(
  'the call shall fail with an SDE database error naming {string}',
  function (text: string) {
    expect(this.error).toBeInstanceOf(SdeDatabaseError);
    expect((this.error as SdeDatabaseError).message).toContain(text);
  },
);
