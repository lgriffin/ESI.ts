import type { BatchResult } from '../../../../src/core/BatchRequestHandler';
import { Then } from '../../support/steps';

Then(
  'the batch shall hold {int} results and {int} errors',
  function (results: number, errors: number) {
    const batch = this.result as BatchResult<string, string>;
    expect([batch.results.size, batch.errors.size]).toEqual([results, errors]);
  },
);
