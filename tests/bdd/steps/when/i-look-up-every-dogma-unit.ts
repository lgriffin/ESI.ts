import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up every dogma unit', function () {
  this.result = sdeProvider(this).getAllDogmaUnits();
});
