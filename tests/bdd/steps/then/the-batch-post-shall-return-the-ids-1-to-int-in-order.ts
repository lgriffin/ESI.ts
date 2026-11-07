import { ids } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the batch post shall return the IDs 1 to {int} in order',
  function (count: number) {
    expect(this.result).toEqual(ids(count));
  },
);
