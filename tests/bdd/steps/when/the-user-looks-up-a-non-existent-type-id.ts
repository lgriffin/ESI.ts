import { sdeProvider, UNKNOWN_TYPE_ID } from '../../support/sde';
import { When } from '../../support/steps';

When('the user looks up a non-existent type ID', function () {
  this.result = sdeProvider(this).getType(UNKNOWN_TYPE_ID);
});
