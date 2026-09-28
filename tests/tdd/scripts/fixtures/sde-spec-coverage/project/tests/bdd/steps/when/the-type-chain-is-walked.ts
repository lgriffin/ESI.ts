import { walkChain } from '../../support/sde';
import { When } from '../../support/steps';

When('the type chain is walked', function () {
  this.result = walkChain(this.sde);
});
