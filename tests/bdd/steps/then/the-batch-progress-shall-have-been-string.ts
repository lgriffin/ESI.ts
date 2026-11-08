import { type BatchProbe } from '../../support/pipeline-parts';
import { Then } from '../../support/steps';

Then(
  'the batch progress shall have been {string}',
  function (progress: string) {
    expect((this.values.probe as BatchProbe).progress.join(', ')).toBe(
      progress,
    );
  },
);
