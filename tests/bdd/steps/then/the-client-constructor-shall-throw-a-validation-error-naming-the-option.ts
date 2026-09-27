import { sentRequests } from '../../support/transport';
import { Then } from '../../support/steps';

Then(
  'the client constructor shall throw a VALIDATION_ERROR naming the option',
  function () {
    expect(this.error).toBeInstanceOf(Error);
    expect((this.error as Error).message).toMatch(
      /^\[VALIDATION_ERROR\] (tenant|userAgent) /,
    );
    expect(sentRequests()).toHaveLength(0);
  },
);
