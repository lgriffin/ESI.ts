import { Given } from '../../support/steps';
import { openReferenceProvider } from '../../support/sde';

Given('a static data provider with the reference data set', function () {
  openReferenceProvider(this);
});
