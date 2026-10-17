import { EXPECTED_META } from '../../support/shared-runtime';
import { Then } from '../../support/steps';

Then(
  "the result's metadata shall report the ETag, expiry, page count and error limit ESI sent",
  function () {
    expect(this.result.meta).toMatchObject(EXPECTED_META);
  },
);
