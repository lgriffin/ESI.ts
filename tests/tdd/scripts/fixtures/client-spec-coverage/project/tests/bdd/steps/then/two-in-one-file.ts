import { Then } from '../../support/steps';

// A scenario binding the first must not be credited with the second's call.
Then('nothing is overridden', function () {
  void this.result;
});

Then('alpha is overridden', function () {
  this.result = this.alpha.overridden();
});
