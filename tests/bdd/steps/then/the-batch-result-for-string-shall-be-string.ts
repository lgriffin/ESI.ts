import type { BatchResult } from '../../../../src/core/BatchRequestHandler';
import { Then } from '../../support/steps';

Then(
  'the batch result for {string} shall be {string}',
  function (key: string, value: string) {
    expect((this.result as BatchResult<string, string>).results.get(key)).toBe(
      value,
    );
  },
);
