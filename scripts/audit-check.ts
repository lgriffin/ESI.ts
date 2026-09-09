/**
 * npm audit gate with an acceptance allowlist and a diff-aware mode.
 *
 * `npm audit` reports the state of the world, not the state of a diff: the same
 * commit passes before an advisory is published and fails after. Run as a plain
 * merge gate that makes every PR hostage to third-party disclosure timing. This
 * script separates the two questions:
 *
 *   --check  Does the tree have unaccepted advisories at or above a threshold?
 *            (for scheduled runs and the release gate)
 *   --diff   Does this PR *introduce* advisories the base branch did not have?
 *            (for the merge path — deterministic with respect to the diff)
 *   --filter Rewrite an npm audit report with accepted advisories removed, in
 *            npm's own shape, so downstream `jq` reporting works unchanged.
 *
 * Usage: npx ts-node scripts/audit-check.ts --check [--level=high]
 *        npx ts-node scripts/audit-check.ts --diff --base <file> --head <file>
 *        npx ts-node scripts/audit-check.ts --filter --in <file> --out <file>
 *        npm run audit:check
 *
 * Both modes read `scripts/audit-exceptions.json` and ignore advisories accepted
 * there. An exception past its `expires` date fails the run.
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const EXCEPTIONS_PATH = path.resolve(__dirname, 'audit-exceptions.json');

const SEVERITY_ORDER = ['info', 'low', 'moderate', 'high', 'critical'] as const;
type Severity = (typeof SEVERITY_ORDER)[number];

interface AuditException {
  ghsa: string;
  package: string;
  severity: string;
  reason: string;
  expires: string;
}

interface Advisory {
  ghsa: string;
  package: string;
  severity: Severity;
  title: string;
  range: string;
}

/** Shape of the objects npm nests in `vulnerabilities[pkg].via`. */
interface RawVia {
  source?: number;
  name?: string;
  title?: string;
  url?: string;
  severity?: string;
  range?: string;
}

interface RawVulnerability {
  name?: string;
  severity?: string;
  via?: (string | RawVia)[];
}

interface AuditReport {
  vulnerabilities?: Record<string, RawVulnerability>;
}

function severityRank(severity: string): number {
  const index = SEVERITY_ORDER.indexOf(severity as Severity);
  return index === -1 ? 0 : index;
}

/**
 * Pull the advisory identifier out of a `via` entry. The GHSA id in the URL is
 * the stable cross-ecosystem identifier; npm's numeric `source` is the fallback
 * for older advisories that predate it.
 */
function advisoryId(via: RawVia): string | undefined {
  const fromUrl = via.url?.match(/GHSA-[0-9a-z-]+/i)?.[0];
  if (fromUrl) return fromUrl;
  return via.source !== undefined ? `npm-${via.source}` : undefined;
}

/**
 * Flatten an audit report into a de-duplicated advisory set.
 *
 * npm lists one entry per *affected package*, so a single advisory reached
 * through several dependency paths appears many times — the @faker-js/faker RCE
 * in Sept 2026 surfaced as six rows. Keying by advisory id collapses those back
 * into the one thing a human has to decide about.
 */
function collectAdvisories(report: AuditReport): Map<string, Advisory> {
  const advisories = new Map<string, Advisory>();

  for (const vuln of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vuln.via ?? []) {
      // String entries name a parent package that merely depends on something
      // vulnerable; only object entries carry an actual advisory.
      if (typeof via === 'string') continue;

      const ghsa = advisoryId(via);
      if (!ghsa || advisories.has(ghsa)) continue;

      advisories.set(ghsa, {
        ghsa,
        package: via.name ?? vuln.name ?? 'unknown',
        severity: (via.severity ?? vuln.severity ?? 'info') as Severity,
        title: via.title ?? '(no title)',
        range: via.range ?? 'n/a',
      });
    }
  }

  return advisories;
}

/**
 * Load accepted advisories, failing on any whose expiry has passed. Expiry is a
 * hard error rather than a warning: an acceptance that quietly outlives its
 * review is indistinguishable from an advisory nobody ever looked at.
 */
function loadExceptions(): Map<string, AuditException> {
  if (!fs.existsSync(EXCEPTIONS_PATH)) return new Map();

  const parsed = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, 'utf-8')) as {
    exceptions?: AuditException[];
  };

  const today = new Date().toISOString().slice(0, 10);
  const expired = (parsed.exceptions ?? []).filter((e) => e.expires < today);

  if (expired.length > 0) {
    console.error('Expired audit exceptions — renew or resolve them:\n');
    for (const e of expired) {
      console.error(`  ${e.ghsa} (${e.package}) expired ${e.expires}`);
    }
    console.error(`\nEdit ${path.relative(process.cwd(), EXCEPTIONS_PATH)}.`);
    process.exit(1);
  }

  return new Map((parsed.exceptions ?? []).map((e) => [e.ghsa, e]));
}

function runAudit(): AuditReport {
  // npm audit exits non-zero whenever it finds anything, so a non-zero status
  // is expected and the payload still lands on stdout.
  let stdout: string;
  try {
    stdout = execFileSync('npm', ['audit', '--json'], {
      encoding: 'utf-8',
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    stdout = (err as { stdout?: string }).stdout ?? '';
  }

  if (!stdout.trim()) {
    console.error('npm audit produced no output.');
    process.exit(1);
  }

  return JSON.parse(stdout) as AuditReport;
}

function readReport(file: string): AuditReport {
  if (!fs.existsSync(file)) {
    console.error(`Audit report not found: ${file}`);
    process.exit(1);
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as AuditReport;
  } catch {
    // Usually means `npm audit --json` itself failed (registry unreachable) and
    // wrote nothing useful. Say so, rather than surfacing a parser stack trace.
    console.error(
      `${file} is not valid JSON — the npm audit that produced it likely failed.`,
    );
    process.exit(1);
  }
}

function describe(advisory: Advisory): string {
  return `  [${advisory.severity}] ${advisory.package} — ${advisory.title}\n      ${advisory.ghsa}  (affected: ${advisory.range})`;
}

function argValue(flag: string): string | undefined {
  const match = process.argv.find((a) => a.startsWith(`${flag}=`));
  if (match) return match.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function checkMode(threshold: string, exceptions: Map<string, AuditException>) {
  const advisories = collectAdvisories(runAudit());
  const minRank = severityRank(threshold);

  const accepted: Advisory[] = [];
  const blocking: Advisory[] = [];

  for (const advisory of advisories.values()) {
    if (exceptions.has(advisory.ghsa)) {
      accepted.push(advisory);
    } else if (severityRank(advisory.severity) >= minRank) {
      blocking.push(advisory);
    }
  }

  console.log(`npm audit — threshold: ${threshold}`);
  console.log(`  advisories found:  ${advisories.size}`);
  console.log(`  accepted:          ${accepted.length}`);
  console.log(`  at/above threshold: ${blocking.length}\n`);

  if (accepted.length > 0) {
    console.log('Accepted (see scripts/audit-exceptions.json):');
    for (const a of accepted) {
      console.log(`  ${a.ghsa} — ${a.package} (${a.severity})`);
    }
    console.log('');
  }

  if (blocking.length === 0) {
    console.log(`No unaccepted advisories at or above "${threshold}".`);
    return;
  }

  console.error(`Unaccepted advisories at or above "${threshold}":\n`);
  for (const a of blocking.sort(
    (x, y) => severityRank(y.severity) - severityRank(x.severity),
  )) {
    console.error(describe(a));
  }
  console.error(
    '\nFix them, or record an accepted risk in scripts/audit-exceptions.json.',
  );
  process.exit(1);
}

function diffMode(
  baseFile: string,
  headFile: string,
  exceptions: Map<string, AuditException>,
) {
  const base = collectAdvisories(readReport(baseFile));
  const head = collectAdvisories(readReport(headFile));

  const introduced = [...head.values()].filter(
    (a) => !base.has(a.ghsa) && !exceptions.has(a.ghsa),
  );
  const resolved = [...base.values()].filter((a) => !head.has(a.ghsa));

  console.log('npm audit — base vs head');
  console.log(`  advisories on base: ${base.size}`);
  console.log(`  advisories on head: ${head.size}`);
  console.log(`  introduced by this PR: ${introduced.length}`);
  console.log(`  resolved by this PR:   ${resolved.length}\n`);

  if (resolved.length > 0) {
    console.log('Resolved by this PR:');
    for (const a of resolved) {
      console.log(`  ${a.ghsa} — ${a.package} (${a.severity})`);
    }
    console.log('');
  }

  if (introduced.length === 0) {
    console.log('This PR introduces no new advisories.');
    if (head.size > 0) {
      const singular = head.size === 1;
      console.log(
        `${head.size} pre-existing advisor${singular ? 'y is' : 'ies are'} tracked by the nightly audit, not by this gate.`,
      );
    }
    return;
  }

  console.error('This PR introduces new advisories:\n');
  for (const a of introduced.sort(
    (x, y) => severityRank(y.severity) - severityRank(x.severity),
  )) {
    console.error(describe(a));
  }
  console.error(
    '\nUpdate the dependency, add an override, or record an accepted risk in scripts/audit-exceptions.json.',
  );
  process.exit(1);
}

/**
 * Strip accepted advisories from a report, preserving npm's structure so the
 * nightly workflow's existing jq queries keep working. A package entry survives
 * if *any* of its advisories is unaccepted — accepting one advisory must not
 * hide a second one that happens to arrive through the same package.
 */
function filterMode(
  inFile: string,
  outFile: string,
  exceptions: Map<string, AuditException>,
) {
  const report = readReport(inFile);
  const vulnerabilities = report.vulnerabilities ?? {};
  const kept: Record<string, RawVulnerability> = {};
  let dropped = 0;

  for (const [name, vuln] of Object.entries(vulnerabilities)) {
    const ids = (vuln.via ?? [])
      .filter((via): via is RawVia => typeof via !== 'string')
      .map(advisoryId)
      .filter((id): id is string => id !== undefined);

    if (ids.length > 0 && ids.every((id) => exceptions.has(id))) {
      dropped++;
      continue;
    }
    kept[name] = vuln;
  }

  fs.writeFileSync(
    outFile,
    JSON.stringify({ ...report, vulnerabilities: kept }),
  );
  console.log(
    `Filtered ${inFile} -> ${outFile}: dropped ${dropped} accepted, kept ${Object.keys(kept).length}.`,
  );
}

function main() {
  const exceptions = loadExceptions();

  if (process.argv.includes('--filter')) {
    const inFile = argValue('--in');
    const outFile = argValue('--out');
    if (!inFile || !outFile) {
      console.error('--filter requires --in <file> and --out <file>');
      process.exit(1);
    }
    filterMode(inFile, outFile, exceptions);
    return;
  }

  if (process.argv.includes('--diff')) {
    const base = argValue('--base');
    const head = argValue('--head');
    if (!base || !head) {
      console.error('--diff requires --base <file> and --head <file>');
      process.exit(1);
    }
    diffMode(base, head, exceptions);
    return;
  }

  checkMode(argValue('--level') ?? 'high', exceptions);
}

main();
