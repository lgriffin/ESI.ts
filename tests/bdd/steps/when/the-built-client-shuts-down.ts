import { surfaceOf } from '../../support/client-construction';
import { When } from '../../support/steps';

When('the built client shuts down', function () {
  surfaceOf(this).shutdown();
});
