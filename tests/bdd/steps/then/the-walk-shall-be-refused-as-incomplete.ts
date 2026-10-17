import { expectPageCapRefusal } from '../../support/security-boundary';
import { Then } from '../../support/steps';

Then('the walk shall be refused as incomplete', function () {
  expectPageCapRefusal(this);
});
