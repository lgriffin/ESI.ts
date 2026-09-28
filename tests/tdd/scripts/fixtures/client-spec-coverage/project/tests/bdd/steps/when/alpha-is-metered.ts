import { When } from '../../support/steps';

When('alpha is metered', function () {
  this.result = this.alpha.withMeta().getMetered();
});
