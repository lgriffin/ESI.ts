import { Then } from '../../support/steps';
import { sdeErrorOf } from '../../support/sdeFiles';

// The directory or archive path the scenario's Given chose, verbatim.
Then('the error shall name the attempted path', function () {
  const attempted = [this.values.sdeDir, this.values.sdeZip].filter(
    (p): p is string => typeof p === 'string',
  );
  expect(attempted.length).toBeGreaterThan(0);
  expect(attempted.some((p) => sdeErrorOf(this).message.includes(p))).toBe(
    true,
  );
});
