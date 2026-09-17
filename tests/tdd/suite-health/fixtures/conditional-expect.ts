// Must be flagged by jest/no-conditional-expect, three times: an assertion in a
// catch block, one behind an if, and one in a promise .catch callback. None of
// them runs when call() resolves.
export {};

async function call(): Promise<number> {
  return 1;
}

describe('a suite', () => {
  it('asserts the error only if one is thrown', async () => {
    expect.hasAssertions();
    try {
      await call();
    } catch (error) {
      expect(error).toBeInstanceOf(RangeError);
    }
  });

  it('asserts the value only when it is there', async () => {
    const value = await call();
    if (value > 1) {
      expect(value).toBe(2);
    }
  });

  it('asserts inside a rejection handler', async () => {
    await call().catch((error: unknown) => {
      expect(error).toBeInstanceOf(RangeError);
    });
  });
});
