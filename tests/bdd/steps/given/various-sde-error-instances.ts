import { sdeErrorInstances } from '../../support/sde';
import { Given } from '../../support/steps';

Given('various SDE error instances', function () {
  this.values.errors = sdeErrorInstances();
});
