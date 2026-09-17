// Must be flagged by jest/no-jasmine-globals, once. jest-circus does not define
// fail(), so this line throws a ReferenceError rather than failing with its
// message.
describe('a suite', () => {
  it('fails with a message it never shows', () => {
    expect(1).toBe(1);
    fail('should not get here');
  });
});
