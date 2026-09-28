import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up groups in category {int}', function (categoryId: number) {
  this.result = sdeProvider(this).getGroupsByCategory(categoryId);
});
