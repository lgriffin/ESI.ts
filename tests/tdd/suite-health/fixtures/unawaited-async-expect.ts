// Must be flagged by jest/valid-expect, twice: async assertions that are neither
// awaited nor returned settle after the test has already passed.
export {};

async function call(): Promise<number> {
  return 1;
}

describe('a suite', () => {
  it('does not await the rejection', async () => {
    expect(call()).rejects.toThrow('boom');
  });

  it('does not await the resolved value', () => {
    expect(call()).resolves.toBe(2);
  });
});
