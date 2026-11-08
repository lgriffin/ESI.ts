import { type BatchProbe } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'no more than {int} fetches shall have run at once',
  function (most: number) {
    expect((this.values.probe as BatchProbe).mostAtOnce).toBe(most);
  },
);
