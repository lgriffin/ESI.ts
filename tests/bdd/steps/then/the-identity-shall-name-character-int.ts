import type { Identity } from '../../../../src/core/ports/Identity';
import { Then } from '../../support/steps';

Then('the identity shall name character {int}', function (characterId: number) {
  expect((this.result as Identity).characterId).toBe(characterId);
});
