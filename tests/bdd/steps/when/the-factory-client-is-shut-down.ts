import { factoryClientOf } from '../../support/factory-client';
import { When } from '../../support/steps';

When('the factory client is shut down', function () {
  factoryClientOf(this).shutdown();
});
