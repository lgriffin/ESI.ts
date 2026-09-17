/**
 * Static checks on the packed tarball: publint and Are The Types Wrong.
 *
 * Both tools read the `.tgz` that `npm pack` produces, not the source tree,
 * so they see exactly the files and `package.json` a consumer installs. The
 * CLI (`scripts/package-lint.ts`, `npm run lint:package`) builds, packs and
 * reports; this module holds the parts its unit tests exercise.
 *
 * What blocks:
 *
 * - publint errors and warnings (its `--strict` level). Suggestions are
 *   printed and never block.
 * - attw problems under the resolutions the package supports: `node16-cjs`,
 *   `node16-esm` and `bundler` (attw's `node16` profile). `node10` is left
 *   out on purpose. It ignores `exports`, so no sub-path other than `.` can
 *   resolve under it; `engines.node` is `>=18`, where every runtime reads
 *   `exports`; and TypeScript deprecated `moduleResolution: node10` in 5.x
 *   and this repository builds with TypeScript 6. A consumer still on
 *   `node10` gets the root entry through `main` and `types`, which attw
 *   reports as green, but that is not a promise this check makes.
 *
 * Known findings live in `scripts/package-lint-baseline.json`, keyed as
 * `<tool>:<code> <where>` with the bead that tracks the fix as the value.
 * The baseline follows the other ratchets (`spec-audit-exceptions.json`,
 * `schema-drift-baseline.json`): a finding outside it fails, an entry that
 * no longer occurs fails, and an entry the base ref's copy lacks fails, so
 * the file only shrinks. With no base ref every entry counts as an addition
 * and the check fails closed.
 */

import { execFileSync, spawnSync } from 'child_process';
import {
  closeSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';

export const REPO_ROOT = path.resolve(__dirname, '..');
export const BASELINE_PATH = path.join(__dirname, 'package-lint-baseline.json');

/** The resolutions the package supports; see the module comment. */
export const ATTW_RESOLUTION_KINDS = [
  'node16-cjs',
  'node16-esm',
  'bundler',
] as const;

export type Severity = 'error' | 'warning' | 'suggestion';

export interface Finding {
  /** Baseline key: `<tool>:<code> <where>`. */
  key: string;
  tool: 'publint' | 'attw';
  severity: Severity;
  message: string;
}

/** Findings that block unless baselined. */
export function isBlocking(finding: Finding): boolean {
  return finding.severity !== 'suggestion';
}

// ---------------------------------------------------------------------------
// Running the tools
// ---------------------------------------------------------------------------

interface ExecResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

function exec(command: string, args: string[], cwd: string): ExecResult {
  // npm is npm.cmd on Windows, which only a shell can start.
  // It gets one command line rather than an args array, which Node deprecates
  // with a shell (DEP0190).
  const shell = process.platform === 'win32' && command === 'npm';
  const options = {
    cwd,
    encoding: 'utf8' as const,
    stdio: ['ignore', 'pipe', 'pipe'] as ('ignore' | 'pipe')[],
    maxBuffer: 64 * 1024 * 1024,
  };
  const result = shell
    ? spawnSync(
        [command, ...args.map((a) => (/\s/.test(a) ? `"${a}"` : a))].join(' '),
        { ...options, shell: true },
      )
    : spawnSync(command, args, options);
  if (result.error) throw result.error;
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

/**
 * `npm pack` the package in `packageDir` into `destination` and return the
 * tarball's path. `--ignore-scripts` keeps `prepare` from rebuilding: what is
 * packed is the `dist/` already on disk.
 */
export function packPackage(packageDir: string, destination: string): string {
  const before = new Set(readdirSync(destination));
  const { status, stdout, stderr } = exec(
    'npm',
    ['pack', '--ignore-scripts', '--pack-destination', destination],
    packageDir,
  );
  if (status !== 0) {
    throw new Error(`npm pack failed in ${packageDir}\n${stdout}${stderr}`);
  }
  const created = readdirSync(destination).filter(
    (f) => f.endsWith('.tgz') && !before.has(f),
  );
  if (created.length !== 1) {
    throw new Error(
      `Expected npm pack to write one tarball, found: ${created.join(', ') || 'none'}`,
    );
  }
  return path.join(destination, created[0]!);
}

/**
 * publint is ESM-only, so it runs in a child `node` process with a real
 * `import`, which prints its messages as JSON. The API, rather than the CLI,
 * because the CLI prints prose and the baseline needs each message's code
 * and `package.json` path.
 */
const PUBLINT_RUNNER = `
import { readFile } from 'node:fs/promises';
const { publint } = await import(process.argv[2]);
const { formatMessage } = await import(process.argv[3]);
const data = await readFile(process.argv[1]);
const tarball = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
const { messages, pkg } = await publint({ pack: { tarball }, level: 'suggestion', strict: true });
process.stdout.write(JSON.stringify(messages.map((m) => ({
  code: m.code,
  type: m.type,
  path: m.path,
  message: formatMessage(m, pkg, { color: false }) ?? m.code,
}))));
`;

interface PublintMessage {
  code: string;
  type: Severity;
  path: string[];
  message: string;
}

/** `['exports', './sde', 'types']` → `exports["./sde"].types`. */
export function formatPackagePath(segments: string[]): string {
  return segments
    .map((segment, i) =>
      /^[A-Za-z_$][\w$]*$/.test(segment)
        ? `${i === 0 ? '' : '.'}${segment}`
        : `[${JSON.stringify(segment)}]`,
    )
    .join('');
}

export function publintFindings(messages: PublintMessage[]): Finding[] {
  return messages.map((m) => ({
    key: `publint:${m.code} ${formatPackagePath(m.path)}`,
    tool: 'publint',
    severity: m.type,
    message: m.message,
  }));
}

export function runPublint(tarball: string): Finding[] {
  const { status, stdout, stderr } = exec(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      PUBLINT_RUNNER,
      path.resolve(tarball),
      // Resolved here, from this repository, and imported by URL there.
      pathToFileURL(require.resolve('publint')).href,
      pathToFileURL(require.resolve('publint/utils')).href,
    ],
    REPO_ROOT,
  );
  if (status !== 0) {
    throw new Error(`publint failed to run on ${tarball}\n${stdout}${stderr}`);
  }
  return publintFindings(JSON.parse(stdout) as PublintMessage[]);
}

/** The parts of `attw --format json` output this check reads. */
export interface AttwJson {
  analysis: {
    types?: unknown;
    problems?: Array<{ kind: string }>;
    entrypoints?: Record<
      string,
      {
        resolutions: Record<string, { visibleProblems?: number[] }>;
      }
    >;
  };
}

/**
 * One finding per problem, entry point and supported resolution. attw lists
 * each problem once and records, per entry point and resolution, the indices
 * of the problems that resolution shows; that is what its own table prints.
 */
export function attwFindings(json: AttwJson): Finding[] {
  const { analysis } = json;
  if (!analysis.types) {
    return [
      {
        key: 'attw:NoTypes .',
        tool: 'attw',
        severity: 'error',
        message: 'The package ships no type declarations.',
      },
    ];
  }
  const problems = analysis.problems ?? [];
  const findings: Finding[] = [];
  for (const [entrypoint, info] of Object.entries(analysis.entrypoints ?? {})) {
    for (const kind of ATTW_RESOLUTION_KINDS) {
      for (const index of info.resolutions[kind]?.visibleProblems ?? []) {
        const problem = problems[index];
        if (!problem) continue;
        findings.push({
          key: `attw:${problem.kind} ${entrypoint} ${kind}`,
          tool: 'attw',
          severity: 'error',
          message: `${problem.kind} for "${entrypoint}" under ${kind}`,
        });
      }
    }
  }
  return findings;
}

export const ATTW_CLI = path.join(
  REPO_ROOT,
  'node_modules',
  '@arethetypeswrong',
  'cli',
  'dist',
  'index.js',
);

/**
 * Run attw on `tarball` and read its JSON report.
 *
 * attw's stdout goes to a file, not a pipe. With `--format json` attw writes
 * the report and then calls `process.exit(1)` when it finds problems. On
 * Linux, once the pipe to the parent is full, Node queues the rest of the
 * write, and `process.exit` drops the queue: CI read a report cut off after
 * 219 kB. Node writes to a file synchronously, so the file holds the whole
 * report. `cli` is a parameter only so a test can substitute a stand-in that
 * exits the same way.
 */
export function runAttw(tarball: string, cli = ATTW_CLI): Finding[] {
  const dir = mkdtempSync(path.join(tmpdir(), 'esi-attw-'));
  const reportFile = path.join(dir, 'attw.json');
  try {
    const fd = openSync(reportFile, 'w');
    let result: ReturnType<typeof spawnSync>;
    try {
      result = spawnSync(
        process.execPath,
        [cli, path.resolve(tarball), '--format', 'json', '--profile', 'node16'],
        {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['ignore', fd, 'pipe'],
          maxBuffer: 64 * 1024 * 1024,
        },
      );
    } finally {
      closeSync(fd);
    }
    if (result.error) throw result.error;
    const report = readFileSync(reportFile, 'utf8');
    const stderr = String(result.stderr ?? '');
    // Exit 1 means "problems found", which the JSON describes. Anything else
    // non-zero is attw itself failing.
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(
        `attw failed to run on ${tarball} (exit ${result.status})\n${report}${stderr}`,
      );
    }
    try {
      return attwFindings(JSON.parse(report) as AttwJson);
    } catch (error) {
      throw new Error(
        `attw on ${tarball} (exit ${result.status}) wrote ${report.length} characters that are not a complete JSON report: ${(error as Error).message}\n${stderr}`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

/** Finding key → bead id. */
export type Baseline = Record<string, string>;

const BEAD_ID = /^esi-[a-z0-9]+(\.[0-9]+)*$/;

export function parseBaseline(raw: string): Baseline {
  const parsed = JSON.parse(raw) as { findings?: unknown };
  const findings = parsed.findings ?? {};
  if (typeof findings !== 'object' || Array.isArray(findings)) {
    throw new Error('package-lint baseline: "findings" must be an object');
  }
  const baseline: Baseline = {};
  for (const [key, bead] of Object.entries(findings)) {
    if (typeof bead !== 'string' || !BEAD_ID.test(bead)) {
      throw new Error(
        `package-lint baseline: "${key}" must name the bead tracking it (esi-…), got ${JSON.stringify(bead)}`,
      );
    }
    baseline[key] = bead;
  }
  return baseline;
}

export function loadBaseline(file = BASELINE_PATH): Baseline {
  return parseBaseline(readFileSync(file, 'utf8'));
}

export interface BaseBaseline {
  /** The ref the baseline was read from, or null when none resolved. */
  ref: string | null;
  /** Null when the ref resolved but predates the baseline file. */
  baseline: Baseline | null;
}

/**
 * The baseline on the integration branch: `PACKAGE_LINT_BASE_REF`, else
 * `origin/master`, else `master`. CI fetches master explicitly, as the spec
 * audit job does.
 */
export function loadBaseBaseline(
  refs = [process.env.PACKAGE_LINT_BASE_REF, 'origin/master', 'master'],
): BaseBaseline {
  const relPath = path
    .relative(REPO_ROOT, BASELINE_PATH)
    .split(path.sep)
    .join('/');
  const git = (args: string[]) =>
    execFileSync('git', args, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

  for (const ref of refs.filter((r): r is string => Boolean(r))) {
    try {
      git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    let raw: string;
    try {
      raw = git(['show', `${ref}:${relPath}`]);
    } catch {
      return { ref, baseline: null }; // The ref predates the baseline file.
    }
    try {
      return { ref, baseline: parseBaseline(raw) };
    } catch {
      // An unreadable base copy cannot vouch for any entry: fail closed.
      return { ref, baseline: {} };
    }
  }
  return { ref: null, baseline: null };
}

export interface Evaluation {
  /** Blocking findings the baseline does not list. */
  unexpected: Finding[];
  /** Baselined findings that still occur. */
  known: Finding[];
  /** Baseline keys no finding matched. */
  stale: string[];
  /** Baseline keys the base ref's copy lacks. */
  added: string[];
  baseRefMissing: boolean;
}

export function evaluate(
  findings: Finding[],
  baseline: Baseline,
  base: BaseBaseline,
): Evaluation {
  const blocking = findings.filter(isBlocking);
  const seen = new Set(blocking.map((f) => f.key));
  const added: string[] = [];
  if (base.ref === null || base.baseline !== null) {
    const before = base.baseline ?? {};
    for (const key of Object.keys(baseline)) {
      if (!(key in before)) added.push(key);
    }
  }
  return {
    unexpected: blocking.filter((f) => !(f.key in baseline)),
    known: blocking.filter((f) => f.key in baseline),
    stale: Object.keys(baseline).filter((key) => !seen.has(key)),
    added,
    baseRefMissing: base.ref === null,
  };
}

export function evaluationProblems(result: Evaluation): string[] {
  const problems: string[] = [];
  if (result.unexpected.length > 0) {
    problems.push(
      `${result.unexpected.length} packaging findings are not in the baseline: fix the package.`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries no longer occur: remove them from scripts/package-lint-baseline.json.`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so the ${result.added.length} baseline entries cannot be shown not to be new. ` +
            'Fetch master or set PACKAGE_LINT_BASE_REF.'
        : `${result.added.length} baseline entries are not on the base branch: the baseline only shrinks.`,
    );
  }
  return problems;
}
