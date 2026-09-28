import type { Blueprint } from '../../../../src/sde/types';
import { Then } from '../../support/steps';

Then('the blueprint should have manufacturing activity', function () {
  const blueprint: Blueprint | null = this.result;
  expect(blueprint).not.toBeNull();
  expect(blueprint!.activities.manufacturing).toBeDefined();
});
