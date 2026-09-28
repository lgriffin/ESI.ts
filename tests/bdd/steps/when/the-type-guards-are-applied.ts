import { applySdeGuards } from '../../support/sde';
import { When } from '../../support/steps';

When('the type guards are applied', function () {
  this.result = applySdeGuards(this.values.errors);
});
