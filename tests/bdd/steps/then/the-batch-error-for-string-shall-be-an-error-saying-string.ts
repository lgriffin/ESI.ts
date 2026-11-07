import type { BatchResult } from '../../../../src/core/BatchRequestHandler';
import { Then } from '../../support/steps';

Then(
  'the batch error for {string} shall be an Error saying {string}',
  function (key: string, message: string) {
    const error = (this.result as BatchResult<string, string>).errors.get(key);
    expect(error).toBeInstanceOf(Error);
    expect(error?.message).toBe(message);
  },
);
