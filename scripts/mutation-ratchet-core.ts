/**
 * Per-directory mutation-score ratchets for the Stryker runs:
 *
 * - the BDD-only run (mutation-bdd-thresholds.json, npm run mutation:bdd:ratchet);
 * - the unit-suite run, nightly over every file and on pull requests over the
 *   changed files (mutation-thresholds.json, npm run mutation:ratchet and
 *   npm run mutation:pr).
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

export type MutantStatus =
  | 'Killed'
  | 'Survived'
  | 'NoCoverage'
  | 'Timeout'
  | 'CompileError'
  | 'RuntimeError'
  | 'Ignored'
  | 'Pending';

export interface ReportMutant {
  status: MutantStatus;
  mutatorName?: string;
  replacement?: string;
  location?: { start: { line: number; column: number } };
}

export interface MutationReport {
  files: Record<string, { mutants: ReportMutant[] }>;
}

export interface DirectoryScore {
  directory: string;
  detected: number;
  valid: number;
  /** Percentage, rounded down to one decimal place. */
  score: number;
}

/** Percentages keyed by directory, e.g. `"src/clients": 42.5`. */
export type Thresholds = Record<string, number>;

/**
 * The directory a file is scored under: `src/<area>` for most of the tree,
 * `src/core/<sub>` inside core, where the pipeline components differ enough
 * that a single number would hide a weak one.
 */
export function directoryOf(file: string): string {
  const parts = normalise(file).split('/');
  const srcIndex = parts.indexOf('src');
  const rel = srcIndex === -1 ? parts : parts.slice(srcIndex);
  if (rel[1] === 'core' && rel.length > 3) return rel.slice(0, 3).join('/');
  if (rel.length > 2) return rel.slice(0, 2).join('/');
  return rel.slice(0, -1).join('/') || (rel[0] ?? '');
}

function normalise(file: string): string {
  return file.replace(/\\/g, '/');
}

interface Tally {
  detected: number;
  valid: number;
}

function tally(mutants: ReportMutant[], into: Tally): Tally {
  for (const { status } of mutants) {
    if (status === 'Killed' || status === 'Timeout') {
      into.detected += 1;
      into.valid += 1;
    } else if (status === 'Survived' || status === 'NoCoverage') {
      into.valid += 1;
    }
  }
  return into;
}

function percent({ detected, valid }: Tally): number {
  return Math.floor((detected / valid) * 1000) / 10;
}

/** Stryker's definition: detected / (detected + undetected); errors and ignored mutants do not count. */
export function scoreByDirectory(report: MutationReport): DirectoryScore[] {
  const totals = new Map<string, Tally>();
  for (const [file, { mutants }] of Object.entries(report.files)) {
    const dir = directoryOf(file);
    totals.set(
      dir,
      tally(mutants, totals.get(dir) ?? { detected: 0, valid: 0 }),
    );
  }
  return [...totals.entries()]
    .filter(([, t]) => t.valid > 0)
    .map(([directory, t]) => ({
      directory,
      detected: t.detected,
      valid: t.valid,
      score: percent(t),
    }))
    .sort((a, b) => a.directory.localeCompare(b.directory));
}

export interface RatchetResult {
  failures: string[];
  /** Thresholds raised to today's scores; never lowered, never dropped. */
  raised: Thresholds;
}

export interface RatchetOptions {
  /** Names the run in failure messages. Defaults to `BDD mutation`. */
  label?: string;
  /**
   * Fail a scored directory that has no entry. The unit-suite ratchet covers
   * every directory it mutates, so a new directory must arrive with its floor.
   */
  requireEntry?: boolean;
}

export function applyRatchet(
  scores: DirectoryScore[],
  thresholds: Thresholds,
  { label = 'BDD mutation', requireEntry = false }: RatchetOptions = {},
): RatchetResult {
  const failures: string[] = [];
  const raised: Thresholds = { ...thresholds };
  const seen = new Set(scores.map((s) => s.directory));

  for (const { directory, score } of scores) {
    const floor = thresholds[directory];
    if (floor === undefined && requireEntry) {
      failures.push(
        `${directory}: ${label} score ${score}% has no ratchet; add "${directory}": ${score} to the thresholds file`,
      );
    }
    if (floor !== undefined && score < floor) {
      failures.push(
        `${directory}: ${label} score ${score}% is below its ratchet of ${floor}%`,
      );
    }
    raised[directory] = Math.max(floor ?? 0, score);
  }
  for (const directory of Object.keys(thresholds)) {
    if (!seen.has(directory)) {
      failures.push(
        `${directory}: has a ratchet but no mutants were scored; was it excluded from the run?`,
      );
    }
  }
  return { failures, raised };
}

export function renderTable(
  scores: DirectoryScore[],
  thresholds: Thresholds,
  label = 'BDD mutation score',
): string {
  const rows = scores.map(({ directory, detected, valid, score }) => {
    const floor = thresholds[directory];
    const ratchet = floor === undefined ? 'none' : `${floor}%`;
    return `| \`${directory}\` | ${score}% | ${detected}/${valid} | ${ratchet} |`;
  });
  return [
    `| Directory | ${label} | Detected / valid | Ratchet |`,
    '| :-- | --: | --: | --: |',
    ...rows,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Thresholds file
// ---------------------------------------------------------------------------

/**
 * Parses a thresholds file. Throws on anything but an object of percentages,
 * so an unreadable file fails the check instead of gating nothing.
 */
export function parseThresholds(raw: string, source: string): Thresholds {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${source} is not valid JSON: ${(err as Error).message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${source} must be an object of directory → percentage`);
  }
  for (const [dir, value] of Object.entries(parsed)) {
    if (typeof value !== 'number' || !(value >= 0 && value <= 100)) {
      throw new Error(
        `${source}: "${dir}" must be a percentage between 0 and 100`,
      );
    }
  }
  return parsed as Thresholds;
}

/**
 * Ratchet direction: a pull request may raise or add a floor, never lower or
 * remove one. `base` is null only when the base branch predates the file.
 */
export function thresholdDecreases(
  base: Thresholds | null,
  head: Thresholds,
  file: string,
): string[] {
  if (base === null) return [];
  const problems: string[] = [];
  for (const [dir, floor] of Object.entries(base)) {
    const next = head[dir];
    if (next === undefined) {
      problems.push(
        `${file}: "${dir}" was removed; ratchets only move up (base ${floor}%)`,
      );
    } else if (next < floor) {
      problems.push(
        `${file}: "${dir}" was lowered from ${floor}% to ${next}%; ratchets only move up`,
      );
    }
  }
  return problems;
}

/** The check could not establish what to compare against: fail closed. */
export class MutationCheckError extends Error {}

/** Runs git with the given arguments and returns stdout; throws on a non-zero exit. */
export type Git = (args: string[]) => string;

function commitExists(git: Git, ref: string): boolean {
  try {
    git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * The commit a pull request is compared with: `explicit` (CI passes HEAD^1,
 * the base tip of the merge commit), else the merge base with origin/master or
 * master. Throws when none resolves, so the check never runs against nothing.
 */
export function resolveBaseRef(git: Git, explicit?: string): string {
  if (explicit) {
    if (!commitExists(git, explicit)) {
      throw new MutationCheckError(
        `MUTATION_BASE_REF=${explicit} is not a commit in this checkout; failing closed.`,
      );
    }
    return explicit;
  }
  for (const ref of ['origin/master', 'master']) {
    if (commitExists(git, ref)) return git(['merge-base', ref, 'HEAD']).trim();
  }
  throw new MutationCheckError(
    'No base to diff against: set MUTATION_BASE_REF or fetch master; failing closed.',
  );
}

/**
 * Head and base copies of a thresholds file. A missing or unreadable head
 * copy throws, as does an unreadable base copy. The base is null only when
 * the base commit predates the file.
 */
export function readThresholdPair(
  git: Git,
  base: string,
  file: string,
  headRaw: string | null,
): { head: Thresholds; base: Thresholds | null } {
  if (headRaw === null) {
    throw new MutationCheckError(`${file} is missing; failing closed.`);
  }
  const parse = (raw: string, source: string) => {
    try {
      return parseThresholds(raw, source);
    } catch (err) {
      throw new MutationCheckError(
        `${(err as Error).message}; failing closed.`,
      );
    }
  };
  const head = parse(headRaw, file);
  try {
    git(['cat-file', '-e', `${base}:${file}`]);
  } catch {
    return { head, base: null };
  }
  return {
    head,
    base: parse(git(['show', `${base}:${file}`]), `${file} at ${base}`),
  };
}

// ---------------------------------------------------------------------------
// Pull request scope
// ---------------------------------------------------------------------------

/** Minimal glob support for Stryker `mutate` patterns: `**`, `*` and `?`. */
export function globToRegExp(pattern: string): RegExp {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i] as string;
    if (ch === '*' && pattern[i + 1] === '*') {
      // `**/` matches zero or more directories; a trailing `**` matches the rest.
      if (pattern[i + 2] === '/') {
        out += '(?:.*/)?';
        i += 2;
      } else {
        out += '.*';
        i += 1;
      }
    } else if (ch === '*') {
      out += '[^/]*';
    } else if (ch === '?') {
      out += '[^/]';
    } else {
      out += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

/** In scope when a positive pattern matches and no `!` pattern does. */
export function inMutationScope(
  file: string,
  patterns: readonly string[],
): boolean {
  const target = normalise(file);
  const positive = patterns.filter((p) => !p.startsWith('!'));
  const negative = patterns
    .filter((p) => p.startsWith('!'))
    .map((p) => p.slice(1));
  return (
    positive.some((p) => globToRegExp(p).test(target)) &&
    !negative.some((p) => globToRegExp(p).test(target))
  );
}

export interface PrPlanInput {
  /** Files the pull request adds or modifies (deletions excluded), repo-relative. */
  changedFiles: readonly string[];
  /** Every tracked file under src/, repo-relative. */
  trackedFiles: readonly string[];
  /** The unit Stryker config's `mutate` patterns. */
  mutatePatterns: readonly string[];
  /**
   * Source text per file in the restored nightly incremental report; null
   * when none was restored.
   */
  baselineSources: ReadonlyMap<string, string> | null;
  /** Current source of a tracked file. */
  readSource: (file: string) => string;
}

export interface PrPlan {
  skip: boolean;
  /** Why the run was skipped, for the job summary. */
  reason: string;
  /** Changed files inside the mutation scope. */
  changed: string[];
  /** Changed src/ files the unit run does not mutate. */
  outOfScope: string[];
  /** Directories whose ratchet this pull request is checked against. */
  directories: string[];
  /**
   * Files passed to `stryker run --mutate`: the changed files, plus any file
   * in the same directories that the baseline cannot vouch for, because it is
   * absent from the baseline or its source has moved on since (Stryker drops,
   * rather than re-runs, stale mutants in files outside `--mutate`). With no
   * baseline that is every file in those directories, so a directory score is
   * never computed from a subset of its files.
   */
  mutate: string[];
}

function sameSource(a: string, b: string): boolean {
  return a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');
}

export function planPrRun({
  changedFiles,
  trackedFiles,
  mutatePatterns,
  baselineSources,
  readSource,
}: PrPlanInput): PrPlan {
  const srcChanged = changedFiles
    .map(normalise)
    .filter((f) => f.startsWith('src/'));
  const changed = srcChanged.filter((f) => inMutationScope(f, mutatePatterns));
  const outOfScope = srcChanged.filter((f) => !changed.includes(f));

  if (changed.length === 0) {
    const reason =
      srcChanged.length === 0
        ? 'This pull request changes no files under src/.'
        : 'This pull request changes src/ files, but none inside the unit mutation scope (stryker.config.mjs `mutate`).';
    return {
      skip: true,
      reason,
      changed,
      outOfScope,
      directories: [],
      mutate: [],
    };
  }

  const directories = [...new Set(changed.map(directoryOf))].sort();
  const siblings = trackedFiles
    .map(normalise)
    .filter(
      (f) =>
        directories.includes(directoryOf(f)) &&
        inMutationScope(f, mutatePatterns),
    );
  const unvouched = siblings.filter((f) => {
    const recorded = baselineSources?.get(f);
    return recorded === undefined || !sameSource(recorded, readSource(f));
  });
  const mutate = [...new Set([...changed, ...unvouched])].sort();

  return {
    skip: false,
    reason: '',
    changed: [...changed].sort(),
    outOfScope,
    directories,
    mutate,
  };
}

/** The report restricted to files scored under the given directories. */
export function reportForDirectories(
  report: MutationReport,
  directories: readonly string[],
): MutationReport {
  return {
    files: Object.fromEntries(
      Object.entries(report.files).filter(([file]) =>
        directories.includes(directoryOf(file)),
      ),
    ),
  };
}

export interface PrGateResult {
  scores: DirectoryScore[];
  failures: string[];
}

/**
 * Gates the directories a pull request touches against the head thresholds.
 * Every touched directory needs a floor, and a floor with no scored mutants
 * fails, so neither a new directory nor a broken run passes silently.
 */
export function gatePrRun(
  report: MutationReport,
  plan: PrPlan,
  thresholds: Thresholds,
): PrGateResult {
  const scores = scoreByDirectory(
    reportForDirectories(report, plan.directories),
  );
  const scoped = Object.fromEntries(
    Object.entries(thresholds).filter(([dir]) =>
      plan.directories.includes(dir),
    ),
  );
  const { failures } = applyRatchet(scores, scoped, {
    label: 'mutation',
    requireEntry: true,
  });
  return { scores, failures };
}

export interface FileScore {
  file: string;
  detected: number;
  valid: number;
  survived: number;
  noCoverage: number;
  /** Null when the file has no valid mutants. */
  score: number | null;
}

export function scoreFiles(
  report: MutationReport,
  files: readonly string[],
): FileScore[] {
  return files.map((file) => {
    const mutants = report.files[file]?.mutants ?? [];
    const t = tally(mutants, { detected: 0, valid: 0 });
    return {
      file,
      ...t,
      survived: mutants.filter((m) => m.status === 'Survived').length,
      noCoverage: mutants.filter((m) => m.status === 'NoCoverage').length,
      score: t.valid === 0 ? null : percent(t),
    };
  });
}

export interface UndetectedMutant {
  file: string;
  line: number;
  status: 'Survived' | 'NoCoverage';
  mutator: string;
  replacement: string;
}

export function undetectedMutants(
  report: MutationReport,
  files: readonly string[],
): UndetectedMutant[] {
  return files.flatMap((file) =>
    (report.files[file]?.mutants ?? [])
      .filter(
        (m): m is ReportMutant & { status: 'Survived' | 'NoCoverage' } =>
          m.status === 'Survived' || m.status === 'NoCoverage',
      )
      .map((m) => ({
        file,
        line: m.location?.start.line ?? 0,
        status: m.status,
        mutator: m.mutatorName ?? 'unknown',
        replacement: m.replacement ?? '',
      }))
      .sort((a, b) => a.line - b.line),
  );
}

function cell(text: string, max = 60): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  const clipped =
    oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
  return `\`${clipped.replace(/`/g, "'").replace(/\|/g, '\\|')}\``;
}

export function renderPrSummary(args: {
  plan: PrPlan;
  scores: DirectoryScore[];
  thresholds: Thresholds;
  files: FileScore[];
  undetected: UndetectedMutant[];
  failures: string[];
  baseline: string;
  maxMutants?: number;
}): string {
  const { plan, scores, thresholds, files, undetected, failures } = args;
  const maxMutants = args.maxMutants ?? 50;
  const lines = [
    '## Mutation testing (changed files)',
    '',
    `Baseline: ${args.baseline}`,
    '',
    renderTable(scores, thresholds, 'Mutation score'),
    '',
    '| Changed file | Score | Detected / valid | Survived | No coverage |',
    '| :-- | --: | --: | --: | --: |',
    ...files.map(
      (f) =>
        `| \`${f.file}\` | ${f.score === null ? 'n/a' : `${f.score}%`} | ${f.detected}/${f.valid} | ${f.survived} | ${f.noCoverage} |`,
    ),
  ];
  if (plan.outOfScope.length > 0) {
    lines.push(
      '',
      `Not mutated (outside the unit mutation scope): ${plan.outOfScope.map((f) => `\`${f}\``).join(', ')}`,
    );
  }
  lines.push('');
  if (undetected.length === 0) {
    lines.push('No surviving mutants in the changed files.');
  } else {
    lines.push(
      `### Undetected mutants in changed files (${undetected.length})`,
      '',
      '| Location | Status | Mutator | Replacement |',
      '| :-- | :-- | :-- | :-- |',
      ...undetected
        .slice(0, maxMutants)
        .map(
          (m) =>
            `| \`${m.file}:${m.line}\` | ${m.status} | ${m.mutator} | ${cell(m.replacement)} |`,
        ),
    );
    if (undetected.length > maxMutants) {
      lines.push(
        '',
        `…and ${undetected.length - maxMutants} more; see the mutation-pr-report artifact.`,
      );
    }
  }
  lines.push('');
  lines.push(
    failures.length === 0
      ? 'Every touched directory meets its ratchet.'
      : ['**Ratchet failures**', '', ...failures.map((f) => `- ${f}`)].join(
          '\n',
        ),
  );
  return `${lines.join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// Negative fixture
// ---------------------------------------------------------------------------

/**
 * The known-weak fixture (tests/mutation-fixture) must show Stryker can both
 * kill a mutant and report one surviving, and that the ratchet turns the
 * survivor into a failure. If any of that stops being true, the PR job's
 * green result means nothing.
 */
export function fixtureSignalProblems(report: MutationReport): string[] {
  const mutants = Object.values(report.files).flatMap((f) => f.mutants);
  const problems: string[] = [];
  if (mutants.length === 0) {
    problems.push('the fixture run produced no mutants');
    return problems;
  }
  if (!mutants.some((m) => m.status === 'Killed')) {
    problems.push(
      'no fixture mutant was killed: the run cannot detect a fault its test does check',
    );
  }
  if (!mutants.some((m) => m.status === 'Survived')) {
    problems.push(
      'no fixture mutant survived: the weak test went unnoticed, so a surviving mutant elsewhere would too',
    );
  }
  const scores = scoreByDirectory(report);
  const perfect = Object.fromEntries(scores.map((s) => [s.directory, 100]));
  if (
    scores.length === 0 ||
    applyRatchet(scores, perfect, { requireEntry: true }).failures.length === 0
  ) {
    problems.push(
      'the ratchet did not fail the fixture against a 100% floor: surviving mutants would not fail a pull request',
    );
  }
  return problems;
}
