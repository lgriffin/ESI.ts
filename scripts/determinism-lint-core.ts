/**
 * The ratchet behind npm run lint:determinism.
 *
 * eslint.determinism.rules.cjs restricts wall-clock reads, real timers and
 * Math.random() in src/ outside the clock module. The sites that exist today
 * are counted per file and construct in scripts/determinism-baseline.json.
 * Counts, not line numbers, so an unrelated edit to a file does not churn the
 * baseline. The baseline only shrinks:
 *
 * - a count above its entry is a new site, and fails;
 * - a count below its entry is a fixed site whose entry was not lowered, and
 *   fails, so the improvement is locked in;
 * - an entry above its count on the base branch grew the baseline, and fails;
 * - with no base ref every entry reads as grown, so the check fails closed.
 */
import { ESLint } from 'eslint';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const determinism = require('../eslint.determinism.rules.cjs') as {
  CLOCK_MODULES: string[];
  CONSTRUCTS: string[];
  constructOf: (message: { message?: string }) => string | null;
  determinismConfig: (parser: unknown) => ESLint.Options['overrideConfig'];
};

export const { CLOCK_MODULES, CONSTRUCTS, constructOf } = determinism;

/** Sites per repository-relative file (forward slashes), then per construct id. */
export type SiteCounts = Record<string, Record<string, number>>;

export interface DeterminismBaseline {
  sites: SiteCounts;
}

export interface Site {
  file: string;
  construct: string;
  line: number;
  column: number;
}

export interface LintOutcome {
  sites: Site[];
  /** Files ESLint linted. Zero means the check compared nothing. */
  filesLinted: number;
  /** Parse errors: a file ESLint could not read was not checked. */
  fatal: string[];
}

/**
 * An ESLint instance carrying only this check's config. Inline
 * `eslint-disable` comments are not honoured: the baseline and the clock
 * module are the only exemptions, and both are reviewed files.
 */
export function createDeterminismLinter(cwd: string): ESLint {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tseslint = require('typescript-eslint') as { parser: unknown };
  return new ESLint({
    cwd,
    overrideConfigFile: true,
    overrideConfig: determinism.determinismConfig(tseslint.parser),
    allowInlineConfig: false,
  });
}

export function toRepoPath(cwd: string, filePath: string): string {
  const normalise = (p: string) => p.replace(/\\/g, '/');
  const root = normalise(cwd).replace(/\/$/, '');
  const file = normalise(filePath);
  return file.startsWith(`${root}/`) ? file.slice(root.length + 1) : file;
}

export function collectSites(
  cwd: string,
  results: ESLint.LintResult[],
): LintOutcome {
  const sites: Site[] = [];
  const fatal: string[] = [];
  for (const result of results) {
    const file = toRepoPath(cwd, result.filePath);
    for (const message of result.messages) {
      if (message.fatal) {
        fatal.push(
          `${file}:${message.line}:${message.column} ${message.message}`,
        );
        continue;
      }
      const construct = constructOf(message);
      if (construct) {
        sites.push({
          file,
          construct,
          line: message.line,
          column: message.column,
        });
      }
    }
  }
  return { sites, filesLinted: results.length, fatal };
}

export function countSites(sites: Site[]): SiteCounts {
  const counts: SiteCounts = {};
  for (const { file, construct } of sites) {
    const perFile = (counts[file] ??= {});
    perFile[construct] = (perFile[construct] ?? 0) + 1;
  }
  return sortCounts(counts);
}

function sortCounts(counts: SiteCounts): SiteCounts {
  return Object.fromEntries(
    Object.keys(counts)
      .sort()
      .map((file) => [
        file,
        Object.fromEntries(
          Object.keys(counts[file]!)
            .sort()
            .map((construct) => [construct, counts[file]![construct]!]),
        ),
      ]),
  );
}

// ---------------------------------------------------------------------------
// Baseline
// ---------------------------------------------------------------------------

export function emptyBaseline(): DeterminismBaseline {
  return { sites: {} };
}

/** Throws on anything but a map of files to positive integer counts of known constructs. */
export function parseBaseline(raw: string): DeterminismBaseline {
  const parsed = JSON.parse(raw) as Partial<DeterminismBaseline>;
  const sites = parsed.sites;
  if (typeof sites !== 'object' || sites === null || Array.isArray(sites)) {
    throw new Error('determinism baseline: "sites" must be an object');
  }
  for (const [file, perFile] of Object.entries(sites)) {
    if (typeof perFile !== 'object' || perFile === null) {
      throw new Error(
        `determinism baseline: ${file} must map constructs to counts`,
      );
    }
    for (const [construct, count] of Object.entries(perFile)) {
      if (!CONSTRUCTS.includes(construct)) {
        throw new Error(
          `determinism baseline: ${file} names unknown construct "${construct}"`,
        );
      }
      if (!Number.isInteger(count) || count < 1) {
        throw new Error(
          `determinism baseline: ${file} ${construct} must be a positive integer`,
        );
      }
    }
  }
  return { sites };
}

export function serializeBaseline(baseline: DeterminismBaseline): string {
  return `${JSON.stringify({ sites: sortCounts(baseline.sites) }, null, 2)}\n`;
}

/**
 * The baseline lowered to today's counts. It never raises an entry or adds
 * one, so a new site still fails after an update. Only when there is no
 * baseline yet does it record every site, to bootstrap the file; the base-ref
 * check stops that being used to launder new sites later.
 */
export function lowerBaseline(
  current: SiteCounts,
  baseline: DeterminismBaseline | null,
): DeterminismBaseline {
  if (baseline === null) return { sites: sortCounts(current) };
  const sites: SiteCounts = {};
  for (const [file, perFile] of Object.entries(baseline.sites)) {
    for (const [construct, allowed] of Object.entries(perFile)) {
      const kept = Math.min(allowed, current[file]?.[construct] ?? 0);
      if (kept > 0) (sites[file] ??= {})[construct] = kept;
    }
  }
  return { sites: sortCounts(sites) };
}

// ---------------------------------------------------------------------------
// Ratchet
// ---------------------------------------------------------------------------

/**
 * The baseline as it stands on the integration branch.
 *
 * `ref: null` means no base ref resolved (a shallow checkout, no git): every
 * entry then reads as an addition, which fails closed. `baseline: null` with a
 * ref means the ref resolved but has no baseline file yet — the one state in
 * which additions cannot be told apart from the file being introduced.
 */
export interface BaseBaseline {
  ref: string | null;
  baseline: DeterminismBaseline | null;
}

export interface CountDelta {
  file: string;
  construct: string;
  /** Sites found now (grown, stale) or allowed by this branch's baseline (added). */
  count: number;
  /** The entry it is compared with: this branch's baseline, or the base branch's. */
  allowed: number;
}

export interface RatchetResult {
  /** Sites found beyond the baseline entry: new time or randomness in src/. */
  grown: CountDelta[];
  /** Entries above today's count: lower them (npm run lint:determinism -- --update). */
  stale: CountDelta[];
  /** Entries above the base branch's: the baseline only shrinks. */
  added: CountDelta[];
  /** Set when no base ref resolved, so additions could not be checked. */
  baseRefMissing: boolean;
}

function keysOf(...maps: SiteCounts[]): Array<[string, string]> {
  const keys = new Map<string, [string, string]>();
  for (const map of maps) {
    for (const [file, perFile] of Object.entries(map)) {
      for (const construct of Object.keys(perFile)) {
        keys.set(JSON.stringify([file, construct]), [file, construct]);
      }
    }
  }
  return [...keys.values()].sort(
    ([fa, ca], [fb, cb]) => fa.localeCompare(fb) || ca.localeCompare(cb),
  );
}

export function applyRatchet(
  current: SiteCounts,
  baseline: DeterminismBaseline,
  base: BaseBaseline,
): RatchetResult {
  const grown: CountDelta[] = [];
  const stale: CountDelta[] = [];
  for (const [file, construct] of keysOf(current, baseline.sites)) {
    const count = current[file]?.[construct] ?? 0;
    const allowed = baseline.sites[file]?.[construct] ?? 0;
    if (count > allowed) grown.push({ file, construct, count, allowed });
    if (count < allowed) stale.push({ file, construct, count, allowed });
  }

  const added: CountDelta[] = [];
  if (base.ref === null || base.baseline !== null) {
    const before = (base.baseline ?? emptyBaseline()).sites;
    for (const [file, construct] of keysOf(baseline.sites)) {
      const count = baseline.sites[file]![construct]!;
      const allowed = before[file]?.[construct] ?? 0;
      if (count > allowed) added.push({ file, construct, count, allowed });
    }
  }

  return { grown, stale, added, baseRefMissing: base.ref === null };
}

export function ratchetProblems(
  result: RatchetResult,
  sites: Site[] = [],
): string[] {
  const problems: string[] = [];
  const describe = (d: CountDelta) =>
    `  ${d.file} ${d.construct}: ${d.count} (baseline ${d.allowed})`;

  if (result.grown.length > 0) {
    const lines = result.grown.flatMap((d) => [
      describe(d),
      ...sites
        .filter((s) => s.file === d.file && s.construct === d.construct)
        .map((s) => `    ${s.file}:${s.line}:${s.column}`),
    ]);
    problems.push(
      `${result.grown.length} file/construct counts exceed the baseline. Take time from the clock module (${CLOCK_MODULES.join(', ')}) instead:\n${lines.join('\n')}`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries are above today's count. Lower them with npm run lint:determinism -- --update:\n${result.stale.map(describe).join('\n')}`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so the ${result.added.length} baseline entries cannot be shown not to be new. Fetch master or set DETERMINISM_BASE_REF.`
        : `${result.added.length} baseline entries are above the base branch's: the baseline only shrinks.\n${result.added.map(describe).join('\n')}`,
    );
  }
  return problems;
}

/** Problems that mean the check itself did not run properly. */
export function integrityProblems(outcome: LintOutcome): string[] {
  const problems: string[] = [];
  if (outcome.filesLinted === 0) {
    problems.push(
      'ESLint linted no files under src/: the check compared nothing.',
    );
  }
  if (outcome.fatal.length > 0) {
    problems.push(
      `ESLint could not parse ${outcome.fatal.length} files, so they were not checked:\n${outcome.fatal.map((f) => `  ${f}`).join('\n')}`,
    );
  }
  return problems;
}
