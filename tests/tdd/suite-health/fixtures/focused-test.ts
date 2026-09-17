// Must be flagged by jest/no-focused-tests, three times.
describe('a suite', () => {
  it.only('runs alone', () => {
    expect(1).toBe(1);
  });

  fit('also runs alone', () => {
    expect(1).toBe(1);
  });
});

fdescribe('a focused suite', () => {
  it('runs', () => {
    expect(1).toBe(1);
  });
});
