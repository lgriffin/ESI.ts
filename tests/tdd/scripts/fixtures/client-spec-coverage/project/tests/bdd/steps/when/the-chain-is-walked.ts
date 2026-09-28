import { walk } from '../../support/clients';
import { When } from '../../support/steps';

When('the chain is walked {int} times', function (times: number) {
  this.result = times * walk(this.alpha);
});
