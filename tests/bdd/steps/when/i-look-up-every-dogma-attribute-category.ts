import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up every dogma attribute category', function () {
  this.result = sdeProvider(this).getAllDogmaAttributeCategories();
});
