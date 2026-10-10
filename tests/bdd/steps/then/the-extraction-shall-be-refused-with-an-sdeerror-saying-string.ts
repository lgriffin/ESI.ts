import { expectSdeErrorSaying } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then(
  'the extraction shall be refused with an SdeError saying {string}',
  function (text: string) {
    expectSdeErrorSaying(this, text);
  },
);
