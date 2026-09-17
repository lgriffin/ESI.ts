// Must be flagged by jest/no-disabled-tests, three times.
describe('a suite', () => {
  it.skip('never runs', () => {
    expect(1).toBe(1);
  });

  xit('never runs either', () => {
    expect(1).toBe(1);
  });
});

xdescribe('a disabled suite', () => {
  it('never runs', () => {
    expect(1).toBe(1);
  });
});
