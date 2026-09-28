import { sdeProvider } from '../../support/sde';
import { When } from '../../support/steps';

When('I look up planet schematic {int}', function (schematicId: number) {
  this.result = sdeProvider(this).getPlanetSchematic(schematicId);
});
