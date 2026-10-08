import { validateEveType } from '../../support/sde';
import { When } from '../../support/steps';

When(
  'the data is validated against the EveType schema without an entity ID',
  function () {
    this.error = validateEveType(this.values.record);
  },
);
