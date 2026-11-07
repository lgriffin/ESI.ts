import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  "the client's retry settings shall be {string}",
  function (settings: string) {
    expect(apiClientOf(this).getRetryConfig()).toEqual(JSON.parse(settings));
  },
);
