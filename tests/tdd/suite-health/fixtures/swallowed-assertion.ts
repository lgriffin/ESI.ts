// Must be flagged by suite-health/no-swallowed-assertion, twice.
async function call(): Promise<number> {
  return 1;
}

describe('a suite', () => {
  it('passes whatever call() returns', async () => {
    expect.hasAssertions();
    try {
      expect(await call()).toBe(2);
    } catch {
      // ignored
    }
  });

  it('logs the failure instead of failing', async () => {
    expect.hasAssertions();
    try {
      const values = await Promise.all([call()]);
      values.forEach((value) => expect(value).toBe(2));
    } catch (error) {
      console.log(error);
    }
  });
});
