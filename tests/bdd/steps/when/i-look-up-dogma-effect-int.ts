import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up dogma effect {int}', function (effectId: number) {
  this.result = sdeProvider(this).getDogmaEffect(effectId);
});
