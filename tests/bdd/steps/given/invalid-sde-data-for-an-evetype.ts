import { INVALID_EVE_TYPE } from '../../support/sde';
import { Given } from '../../support/steps';

Given('invalid SDE data for an EveType', function () {
  this.values.record = INVALID_EVE_TYPE;
});
