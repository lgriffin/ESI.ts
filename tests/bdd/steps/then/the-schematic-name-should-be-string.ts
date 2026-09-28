import type { PlanetSchematic } from '../../../../src/sde/domain/types';
import { Then } from '../../support/steps';

Then('the schematic name should be {string}', function (name: string) {
  const schematic: PlanetSchematic | null = this.result;
  expect(schematic).not.toBeNull();
  expect(schematic!.name).toBe(name);
});
