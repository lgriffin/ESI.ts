import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up types in group {int}', function (groupId: number) {
  this.result = sdeProvider(this).getTypesByGroup(groupId);
});
