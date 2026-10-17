import { expectCutOffAt } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then('the walk shall be cut off at page {int}', function (pages: number) {
  expectCutOffAt(this, pages);
});
