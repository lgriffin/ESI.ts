import { EsiClient } from '../../../../src/EsiClient';
import { Then } from '../../support/steps';

Then('the construction shall succeed', function () {
  expect(this.error).toBeUndefined();
  expect(this.result).toBeInstanceOf(EsiClient);
});
