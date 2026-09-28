import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('the user looks up type ID {int}', function (typeId: number) {
  this.result = sdeProvider(this).getType(typeId);
});
