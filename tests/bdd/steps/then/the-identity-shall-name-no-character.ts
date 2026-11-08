import type { Identity } from '../../../../src/core/ports/Identity';
import { Then } from '../../support/steps';

Then('the identity shall name no character', function () {
  expect(this.result).toBeDefined();
  expect('characterId' in (this.result as Identity)).toBe(false);
});
