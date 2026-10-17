import {
  type CountingDeduplicator,
  suppliedOf,
} from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  'the supplied deduplicator shall have been asked {int} times',
  function (count: number) {
    expect(suppliedOf<CountingDeduplicator>(this, 'deduplicator').asked).toBe(
      count,
    );
  },
);
