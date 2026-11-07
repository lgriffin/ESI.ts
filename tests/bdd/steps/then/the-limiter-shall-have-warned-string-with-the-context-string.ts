import { warnings } from '../../support/rate-limiter';
import { Then } from '../../support/steps';

Then(
  'the limiter shall have warned {string} with the context {string}',
  function (message: string, context: string) {
    expect(warnings(this)).toContainEqual({
      message,
      context: JSON.parse(context),
    });
  },
);
