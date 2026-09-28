import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up moon {int}', function (moonId: number) {
  this.result = sdeProvider(this).getMoon(moonId);
});
