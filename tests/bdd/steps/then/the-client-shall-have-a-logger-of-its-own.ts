import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('the client shall have a logger of its own', function () {
  expect(apiClientOf(this).getLogger()).not.toBeNull();
});
