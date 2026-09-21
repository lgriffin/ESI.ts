/**
 * Tier P: did what got published actually work?
 *
 * Everything before publish checks what CI built. None of it checks what the
 * registry hands a consumer twenty minutes later, and those are not the same
 * artefact: `publish-npm` rebuilds rather than uploading the tarball the
 * consumer matrix tested (esi-23g.42), the registry could serve a partial or
 * superseded version, and a broken `exports` map is invisible until somebody
 * installs it.
 *
 * So the canary installs the published version into an empty directory, with
 * no repository on disk to fall back to, and asks five questions of it:
 *
 *   registry     the exact version is served, and its tarball resolves
 *   signatures   npm's registry signature and provenance attestation verify
 *   subpaths     every documented sub-path loads under both require and import
 *   live         one real call to public ESI returns data
 *   assets       the GitHub release assets (tarball, SBOM, bundles) check
 *                against checksums.txt, verify under cosign's keyless
 *                identity, and the SBOM names this version
 *
 * The `assets` check exists for esi-23g.67: the tarball and SBOM were signed
 * and listed in `checksums.txt` by `release.yml`, and the steps were
 * documented in `guides/RELEASE.md`, but nothing ever ran those steps
 * end-to-end against a published release — on 10.2.0 the checksum and the
 * certificate identity were checked by hand, and `cosign verify-blob` was
 * never run against a real bundle. A consumer who downloads the assets now
 * hits whatever this check hit.
 *
 * A consumer who runs `npm install` and one query exercises all four. If any
 * fails, that consumer is broken right now, which is why a failure opens a
 * high-severity issue rather than a nightly note.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/** The five things the canary establishes, in the order it establishes them. */
export const CANARY_CHECKS = [
  'registry',
  'signatures',
  'subpaths',
  'live',
  'assets',
] as const;

export type CanaryCheck = (typeof CANARY_CHECKS)[number];

export interface CheckResult {
  check: CanaryCheck;
  ok: boolean;
  /** What happened, for the log and the issue body. */
  detail: string;
  /**
   * The check did not run, because an earlier one made it meaningless — there
   * is no point probing sub-paths of a version the registry never served.
   */
  skipped?: boolean;
}

export class ReleaseCanaryError extends Error {}

/**
 * The version to verify, from a tag like `v10.1.0` or a bare `10.1.0`.
 *
 * Strict, because the canary installs whatever this returns: a loose parse
 * that yielded `latest` would have it verify a different release from the one
 * that triggered it and report success for an artefact nobody asked about.
 */
export function versionFrom(ref: string): string {
  const trimmed = ref.trim().replace(/^refs\/tags\//, '');
  const match = /^v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(trimmed);
  if (!match?.[1]) {
    throw new ReleaseCanaryError(
      `Cannot read a version from "${ref}". Expected vX.Y.Z, X.Y.Z or a pre-release such as v11.0.0-next.1.`,
    );
  }
  return match[1];
}

/**
 * The identity `release.yml` is expected to verify under. Keyless cosign
 * carries the workflow, not a key, in the certificate: `.github/workflows`
 * plus the tag it ran on. So the canary can anchor `--certificate-identity`
 * on a full match rather than a loose prefix — a bundle minted for a
 * different tag or workflow does not match, and the check fails on it.
 */
export function assetIdentitySpec(
  repository: string,
  version: string,
): { identity: string; issuer: string } {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new ReleaseCanaryError(
      `Cannot read a repository as "owner/name" from "${repository}".`,
    );
  }
  return {
    identity: `https://github.com/${repository}/.github/workflows/release.yml@refs/tags/v${version}`,
    issuer: 'https://token.actions.githubusercontent.com',
  };
}

/**
 * Everything wrong with a canary run, one line each.
 *
 * Fails closed twice over: a check that reported nothing is a problem, and so
 * is a check this file does not know about. A canary that passes because it
 * forgot to run something is worse than no canary, since its green tick is
 * what a maintainer reads before telling people the release is good.
 */
export function canaryProblems(results: CheckResult[]): string[] {
  const problems: string[] = [];
  const seen = new Map<string, CheckResult>();

  for (const result of results) {
    if (!CANARY_CHECKS.includes(result.check)) {
      problems.push(`${result.check}: not a check this canary defines`);
      continue;
    }
    if (seen.has(result.check)) {
      problems.push(`${result.check}: reported twice`);
      continue;
    }
    seen.set(result.check, result);
  }

  for (const check of CANARY_CHECKS) {
    const result = seen.get(check);
    if (result === undefined) {
      problems.push(`${check}: did not report, so nothing establishes it`);
    } else if (result.skipped) {
      problems.push(`${check}: did not run (${result.detail})`);
    } else if (!result.ok) {
      problems.push(`${check}: ${result.detail}`);
    }
  }

  return problems;
}

/** Whether the published release can be called verified. */
export function isVerified(results: CheckResult[]): boolean {
  return canaryProblems(results).length === 0;
}

/** The step-summary and issue body for a run. */
export function renderCanaryReport(
  packageName: string,
  version: string,
  results: CheckResult[],
): string {
  const problems = canaryProblems(results);
  const lines = [
    `## Post-publish canary: ${packageName}@${version}`,
    '',
    problems.length === 0
      ? 'Verified. The published package installs, verifies, loads every documented sub-path, answers a live call, and its release assets check out end to end.'
      : `**Not verified.** ${problems.length} problem${problems.length === 1 ? '' : 's'} below. Consumers installing this version hit the same thing.`,
    '',
    '| Check | Result | Detail |',
    '| :-- | :-- | :-- |',
  ];

  for (const check of CANARY_CHECKS) {
    const result = results.find((r) => r.check === check);
    const mark =
      result === undefined
        ? 'not reported'
        : result.skipped
          ? 'skipped'
          : result.ok
            ? 'ok'
            : 'FAILED';
    lines.push(`| \`${check}\` | ${mark} | ${result?.detail ?? '—'} |`);
  }

  if (problems.length > 0) {
    lines.push(
      '',
      '### What to do',
      '',
      'A published version cannot be replaced. The playbook is in `guides/RELEASE.md`:',
      `deprecate it (\`npm deprecate ${packageName}@${version} "<why, and what to use>"\`),`,
      'fix forward, and publish the patch. Deprecating leaves the version installable',
      'for anyone already pinned to it while warning everyone else.',
    );
  }

  return lines.join('\n');
}
