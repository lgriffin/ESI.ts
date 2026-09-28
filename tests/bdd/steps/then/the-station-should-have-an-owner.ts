import type { NpcStation } from '../../../../src/sde/domain/types';
import { Then } from '../../support/steps';

Then('the station should have an owner', function () {
  const station: NpcStation | null = this.result;
  expect(station).not.toBeNull();
  expect(station!.ownerId).toBeGreaterThan(0);
});
