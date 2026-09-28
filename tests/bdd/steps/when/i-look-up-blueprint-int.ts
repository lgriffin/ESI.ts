import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up blueprint {int}', function (blueprintTypeId: number) {
  this.result = sdeProvider(this).getBlueprint(blueprintTypeId);
});
