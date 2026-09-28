import { When } from '../../support/steps';
import { sdeProvider } from '../../support/sde';

When('I look up asteroid belt {int}', function (asteroidBeltId: number) {
  this.result = sdeProvider(this).getAsteroidBelt(asteroidBeltId);
});
