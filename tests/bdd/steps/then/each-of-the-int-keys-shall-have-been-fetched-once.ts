import { type BatchProbe, keys } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'each of the {int} keys shall have been fetched once',
  function (count: number) {
    expect((this.values.probe as BatchProbe).fetched).toEqual(keys(count));
  },
);
