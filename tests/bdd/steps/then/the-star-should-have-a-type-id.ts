import type { Star } from '../../../../src/sde/types';
import { Then } from '../../support/steps';

Then('the star should have a type ID', function () {
  const star: Star | null = this.result;
  expect(star).not.toBeNull();
  expect(star!.typeId).toBeGreaterThan(0);
});
