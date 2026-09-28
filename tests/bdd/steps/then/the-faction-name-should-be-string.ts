import type { Faction } from '../../../../src/sde/types';
import { Then } from '../../support/steps';

Then('the faction name should be {string}', function (name: string) {
  const faction: Faction | null = this.result;
  expect(faction).not.toBeNull();
  expect(faction!.name).toBe(name);
});
