// Linted as tests/bdd/steps/then/: must be flagged by jest/expect-expect, once.
import { Then } from '../../support/steps';

Then('the client shall return current status information', function () {
  this.result = undefined;
});
