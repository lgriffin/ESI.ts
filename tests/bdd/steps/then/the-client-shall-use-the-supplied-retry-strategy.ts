import { apiClientOf } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('the client shall use the supplied retry strategy', function () {
  expect(this.values.suppliedStrategy).toBeDefined();
  expect(apiClientOf(this).getRetryStrategy()).toBe(
    this.values.suppliedStrategy,
  );
});
