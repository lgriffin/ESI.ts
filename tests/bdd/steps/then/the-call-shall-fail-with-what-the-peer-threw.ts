import { Then } from '../../support/steps';

// The value a failing peer threw, rethrown as it was: same object, or same
// string, not a wrapped SdeError.
Then('the call shall fail with what the peer threw', function () {
  expect(this.values.peerFailure).toBeDefined();
  expect(this.error).toBe(this.values.peerFailure);
});
