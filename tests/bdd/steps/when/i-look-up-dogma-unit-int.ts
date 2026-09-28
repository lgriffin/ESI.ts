import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up dogma unit {int}', function (unitId: number) {
  this.result = sdeProvider(this).getDogmaUnit(unitId);
});
