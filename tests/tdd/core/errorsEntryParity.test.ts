import * as rootEntry from '../../../src';
import * as errorsEntry from '../../../src/errors';
import * as errorModule from '../../../src/core/util/error';
import * as authErrors from '../../../src/auth/errors';

// #266: every error class and guard the root exports is also on ./errors,
// as the same value, so a guard from either entry matches the other's errors.
describe('./errors entry parity', () => {
  const errorExports = new Set([
    ...Object.keys(errorModule),
    ...Object.keys(authErrors),
  ]);
  const rootErrorExports = Object.keys(rootEntry).filter((k) =>
    errorExports.has(k),
  );

  it.each(rootErrorExports)('%s is exported from ./errors', (name) => {
    expect((errorsEntry as Record<string, unknown>)[name]).toBe(
      (rootEntry as Record<string, unknown>)[name],
    );
  });

  it('exports isCircuitOpen from ./errors', () => {
    expect(errorsEntry.isCircuitOpen).toBe(rootEntry.isCircuitOpen);
  });
});
