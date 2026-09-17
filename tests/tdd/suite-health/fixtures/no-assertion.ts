// Must be flagged by jest/expect-expect, twice: a test that asserts nothing,
// and one whose only call is a helper not named like an assertion.
function checkStatus(status: number): boolean {
  return status === 200;
}

describe('a suite', () => {
  it('calls the code and checks nothing', () => {
    new Date().toISOString();
  });

  it('computes a verdict and never asserts it', () => {
    checkStatus(200);
  });
});
