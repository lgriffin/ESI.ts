import type { AsteroidBelt } from '../../../../src/sde/domain/types';
import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up asteroid belts for system {int}', function (systemId: number) {
  const belts: AsteroidBelt[] =
    sdeProvider(this).getAsteroidBeltsBySystem(systemId);
  this.result = belts;
});
