import { Then } from '../../support/steps';

// Two steps in one file: a scenario binding the first must not be credited
// with the second's call.
Then('the version is not read', function () {
  void this.result;
});

Then('the version is read', function () {
  this.result = this.sde.getVersion();
});
