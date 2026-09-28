import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up every category', function () {
  this.result = sdeProvider(this).getAllCategories();
});
