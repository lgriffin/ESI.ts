/**
 * Self-tests for the post-publish canary (scripts/release-canary-core.ts).
 *
 * The canary's green tick is what a maintainer reads before telling people a
 * release is good, so the ways it could be wrongly green matter more than the
 * ways it could be wrongly red. Two of them are structural rather than about
 * any single check: a check that never reported, and a check name nobody
 * defines. Both are treated as failures here, because "we did not look" and
 * "we looked and it was fine" must not produce the same tick.
 *
 * The live proof is in the pull request: run against 9.0.0, which predates the
 * ./sde sub-path, the canary fails with ERR_PACKAGE_PATH_NOT_EXPORTED; against
 * 10.0.0 it verifies all four checks including a real call to ESI.
 */
import {
  CANARY_CHECKS,
  CheckResult,
  ReleaseCanaryError,
  assetIdentitySpec,
  canaryProblems,
  isVerified,
  renderCanaryReport,
  versionFrom,
} from '../../../scripts/release-canary-core';

function ok(check: CheckResult['check']): CheckResult {
  return { check, ok: true, detail: 'fine' };
}

/** A run where everything passed. */
function allOk(): CheckResult[] {
  return CANARY_CHECKS.map(ok);
}

describe('versionFrom', () => {
  it.each([
    ['v10.1.0', '10.1.0'],
    ['10.1.0', '10.1.0'],
    ['refs/tags/v10.1.0', '10.1.0'],
    ['  v10.1.0  ', '10.1.0'],
    ['v11.0.0-next.1', '11.0.0-next.1'],
  ])('reads %s as %s', (input, expected) => {
    expect(versionFrom(input)).toBe(expected);
  });

  it.each(['', 'latest', 'v10', 'main', 'v10.1', 'release-10.1.0'])(
    'refuses %p rather than verifying some other release',
    (input) => {
      expect(() => versionFrom(input)).toThrow(ReleaseCanaryError);
    },
  );
});

describe('assetIdentitySpec', () => {
  it('anchors the full workflow identity for the given tag', () => {
    const { identity, issuer } = assetIdentitySpec('lgriffin/ESI.ts', '10.2.0');
    expect(identity).toBe(
      'https://github.com/lgriffin/ESI.ts/.github/workflows/release.yml@refs/tags/v10.2.0',
    );
    expect(issuer).toBe('https://token.actions.githubusercontent.com');
  });

  it('does not match a bundle minted for a different tag', () => {
    const { identity } = assetIdentitySpec('lgriffin/ESI.ts', '10.2.0');
    const wrong = assetIdentitySpec('lgriffin/ESI.ts', '10.1.0').identity;
    expect(identity).not.toBe(wrong);
  });

  it.each(['lgriffin/ESI.ts/extra', 'lgriffin', 'ESI.ts', 'a b/c', ''])(
    'refuses %p as a repository',
    (repo) => {
      expect(() => assetIdentitySpec(repo, '10.2.0')).toThrow(
        ReleaseCanaryError,
      );
    },
  );
});

describe('canaryProblems', () => {
  it('finds nothing wrong with a run where every check passed', () => {
    expect(canaryProblems(allOk())).toEqual([]);
    expect(isVerified(allOk())).toBe(true);
  });

  it('reports a failed check with its detail', () => {
    const results = allOk().map((r) =>
      r.check === 'subpaths'
        ? { ...r, ok: false, detail: "'./sde' is not defined by exports" }
        : r,
    );
    expect(canaryProblems(results)).toEqual([
      "subpaths: './sde' is not defined by exports",
    ]);
    expect(isVerified(results)).toBe(false);
  });

  it('treats a check that never reported as a problem', () => {
    // The failure this exists for: a canary that forgot to run something and
    // reported success anyway.
    const results = allOk().filter((r) => r.check !== 'live');
    expect(canaryProblems(results)).toEqual([
      'live: did not report, so nothing establishes it',
    ]);
  });

  it('treats a skipped check as a problem, not a pass', () => {
    const results = allOk().map((r) =>
      r.check === 'live'
        ? { ...r, ok: false, skipped: true, detail: '--skip-live' }
        : r,
    );
    expect(canaryProblems(results)).toEqual([
      'live: did not run (--skip-live)',
    ]);
  });

  it('reports a check name it does not define', () => {
    const results = [
      ...allOk(),
      { check: 'vibes' as CheckResult['check'], ok: true, detail: 'good' },
    ];
    expect(canaryProblems(results)).toContain(
      'vibes: not a check this canary defines',
    );
  });

  it('reports a check that reported twice', () => {
    const results = [...allOk(), ok('live')];
    expect(canaryProblems(results)).toContain('live: reported twice');
  });

  it('reports every problem, not just the first', () => {
    const results = allOk()
      .filter((r) => r.check !== 'live')
      .map((r) => (r.check === 'subpaths' ? { ...r, ok: false } : r));
    expect(canaryProblems(results)).toHaveLength(2);
  });
});

describe('renderCanaryReport', () => {
  const pkg = '@lgriffin/esi.ts';

  it('says verified when everything passed, and gives no playbook', () => {
    const report = renderCanaryReport(pkg, '10.1.0', allOk());
    expect(report).toContain('Verified.');
    expect(report).not.toContain('npm deprecate');
  });

  it('names the count and the consequence when something failed', () => {
    const results = allOk().map((r) =>
      r.check === 'live' ? { ...r, ok: false, detail: 'timed out' } : r,
    );
    const report = renderCanaryReport(pkg, '10.1.0', results);
    expect(report).toContain('**Not verified.** 1 problem');
    expect(report).toContain('Consumers installing this version hit the same');
  });

  it('gives the deprecate playbook with the real version in it', () => {
    const results = allOk().map((r) =>
      r.check === 'subpaths' ? { ...r, ok: false, detail: 'broken' } : r,
    );
    const report = renderCanaryReport(pkg, '10.1.0', results);
    expect(report).toContain(`npm deprecate ${pkg}@10.1.0`);
    expect(report).toContain('guides/RELEASE.md');
  });

  it('lists every check, including one that never reported', () => {
    const report = renderCanaryReport(pkg, '10.1.0', [ok('registry')]);
    for (const check of CANARY_CHECKS) {
      expect(report).toContain(`\`${check}\``);
    }
    expect(report).toContain('not reported');
  });
});
