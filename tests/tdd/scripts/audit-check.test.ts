/**
 * The --filter step of scripts/quality/audit-check.ts, which the nightly audit
 * runs before deciding whether to file an issue.
 *
 * npm reports a package that is vulnerable only through a dependency with a
 * string in `via` naming that dependency. Accepting the advisory has to drop
 * that whole chain, or the issue keeps re-filing for packages that carry
 * nothing but the accepted risk (issue #588: fast-glob, globby, micromatch
 * and tsd, all through braces).
 */
import { withoutAccepted } from '../../../scripts/quality/audit-check';

const advisory = (ghsa: string, name: string) => ({
  source: 1,
  name,
  url: `https://github.com/advisories/${ghsa}`,
  severity: 'high',
});

const BRACES = 'GHSA-vfj7-8cjw-p6xm';
const OTHER = 'GHSA-aaaa-bbbb-cccc';

describe('withoutAccepted', () => {
  const chain = {
    braces: { name: 'braces', via: [advisory(BRACES, 'braces')] },
    micromatch: { name: 'micromatch', via: ['braces'] },
    'fast-glob': { name: 'fast-glob', via: ['micromatch'] },
    globby: { name: 'globby', via: ['fast-glob'] },
    tsd: { name: 'tsd', via: ['globby'] },
  };

  it('drops every package that only carries an accepted advisory', () => {
    expect(withoutAccepted(chain, new Set([BRACES]))).toEqual({});
  });

  it('keeps the whole chain while the advisory is not accepted', () => {
    expect(Object.keys(withoutAccepted(chain, new Set()))).toEqual(
      Object.keys(chain),
    );
  });

  it('keeps a package that also reaches an unaccepted advisory', () => {
    const vulnerabilities = {
      ...chain,
      other: { name: 'other', via: [advisory(OTHER, 'other')] },
      both: { name: 'both', via: ['braces', 'other'] },
      direct: {
        name: 'direct',
        via: [advisory(BRACES, 'direct'), advisory(OTHER, 'direct')],
      },
    };
    expect(
      Object.keys(withoutAccepted(vulnerabilities, new Set([BRACES]))),
    ).toEqual(['other', 'both', 'direct']);
  });

  it('survives a cycle and keeps an entry with no advisory it can name', () => {
    const vulnerabilities = {
      a: { name: 'a', via: ['b'] },
      b: { name: 'b', via: ['a'] },
    };
    expect(Object.keys(withoutAccepted(vulnerabilities, new Set()))).toEqual([
      'a',
      'b',
    ]);
  });
});
