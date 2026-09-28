import { When } from '../../support/steps';

When('alpha is called directly', function () {
  // A comment naming getNamedBare() is not a call, nor is 'getAmbiguous'.
  this.result = [this.alpha.getDirect(), this.alpha.getShared()];
});
