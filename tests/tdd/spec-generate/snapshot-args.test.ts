/**
 * Argument parsing for scripts/snapshot-openapi.ts. A mistyped option used to
 * fall through to the default date, so the refresh vendored a document nobody
 * asked for and reported success.
 */
import { parseCompatibilityDate } from '../../../scripts/snapshot-openapi';

describe('parseCompatibilityDate', () => {
  it('uses the fallback with no arguments', () => {
    expect(parseCompatibilityDate([], '2026-05-19')).toBe('2026-05-19');
  });

  it('takes one well-formed --compatibility-date', () => {
    expect(
      parseCompatibilityDate(['--compatibility-date=2026-08-04'], '2026-05-19'),
    ).toBe('2026-08-04');
  });

  it.each([
    [['--compatability-date=2026-08-04']],
    [['--compatibility-date=2026-8-4']],
    [['--compatibility-date']],
    [['--latest']],
    [['--compatibility-date=2026-08-04', '--compatibility-date=2026-09-01']],
  ])('rejects %j', (args) => {
    expect(() => parseCompatibilityDate(args, '2026-05-19')).toThrow(
      /Expected no arguments or one --compatibility-date/,
    );
  });
});
