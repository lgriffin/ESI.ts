import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('the client shall serialise to {string}', function (json: string) {
  expect(JSON.parse(JSON.stringify(apiClientOf(this)))).toEqual(
    JSON.parse(json),
  );
});
