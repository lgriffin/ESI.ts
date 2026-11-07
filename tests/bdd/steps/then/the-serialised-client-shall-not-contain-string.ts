import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the serialised client shall not contain {string}',
  function (secret: string) {
    expect(JSON.stringify(apiClientOf(this))).not.toContain(secret);
  },
);
