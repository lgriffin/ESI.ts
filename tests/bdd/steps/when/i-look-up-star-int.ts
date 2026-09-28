import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up star {int}', function (starId: number) {
  this.result = sdeProvider(this).getStar(starId);
});
