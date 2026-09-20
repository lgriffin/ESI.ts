// Must be flagged by suite-health/no-unrestored-console-mock, three times: an
// unbound spy, a bound spy never restored, and a console method reassigned.
describe('a suite', () => {
  it('silences warnings for the rest of the file', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(1).toBe(1);
  });

  it('keeps the spy but never restores it', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('replaces console.log outright', () => {
    console.log = jest.fn();
    expect(1).toBe(1);
  });
});
