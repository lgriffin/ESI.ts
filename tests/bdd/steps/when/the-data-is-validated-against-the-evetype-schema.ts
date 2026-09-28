import { TRITANIUM, validateEveType } from '../../support/sde';
import { When } from '../../support/steps';

When('the data is validated against the EveType schema', function () {
  this.error = validateEveType(this.values.record, TRITANIUM.typeId);
});
