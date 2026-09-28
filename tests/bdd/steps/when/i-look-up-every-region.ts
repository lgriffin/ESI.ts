import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up every region', function () {
  this.result = sdeProvider(this).getAllRegions();
});
