import { expectEsiErrorSaying } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then(
  'the call shall be rejected with an EsiError saying {string}',
  function (text: string) {
    expectEsiErrorSaying(this, text);
  },
);
