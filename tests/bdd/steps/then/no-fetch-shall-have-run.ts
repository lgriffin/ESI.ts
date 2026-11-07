import { type BatchProbe } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then('no fetch shall have run', function () {
  expect((this.values.probe as BatchProbe).fetched).toEqual([]);
});
