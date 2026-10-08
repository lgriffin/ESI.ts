/**
 * The ratchet behind npm run lint:ratchet.
 *
 * `npm run lint` fails on errors only, so warnings could grow without anyone
 * deciding they should. This counts the warnings the main ESLint config
 * reports over src/, tests/ and scripts/ per file and rule, and holds them to
 * config/eslint/warning-baseline.json with the same shrink-only rules as the
 * determinism lint (scripts/quality/determinism-lint-core.ts):
 *
 * - a count above its entry is a new warning, and fails;
 * - a count below its entry is a fixed warning whose entry was not lowered,
 *   and fails, so the improvement is locked in;
 * - an entry above its count on the base branch grew the baseline, and fails;
 * - with no base ref every entry reads as grown, so the check fails closed.
 *
 * Errors fail outright, as they do in `npm run lint`.
 */
import { ESLint } from 'eslint';
import {
  BaseBaseline,
  RatchetResult,
  SiteCounts,
  applyRatchet,
  countSites,
  lowerBaseline,
  toRepoPath,
} from './determinism-lint-core';

export type { BaseBaseline, SiteCounts };
export { applyRatchet, lowerBaseline };

/** The rule id an "Unused eslint-disable directive" warning is counted under. */
export const UNUSED_DIRECTIVE = 'unused-disable-directive';

export interface WarningBaseline {
  sites: SiteCounts;
}

export interface Warning {
  file: string;
  /** The ESLint rule id; the `construct` the shared ratchet counts by. */
  construct: string;
  line: number;
  column: number;
}

export interface WarningOutcome {
  warnings: Warning[];
  /** `file:line:column rule message` for every error. */
  errors: string[];
  /** Parse errors: a file ESLint could not read was not checked. */
  fatal: string[];
  filesLinted: number;
}

export function collectWarnings(
  cwd: string,
  results: ESLint.LintResult[],
): WarningOutcome {
  const warnings: Warning[] = [];
  const errors: string[] = [];
  const fatal: string[] = [];
  for (const result of results) {
    const file = toRepoPath(cwd, result.filePath);
    for (const m of result.messages) {
      const where = `${file}:${m.line}:${m.column}`;
      if (m.fatal) {
        fatal.push(`${where} ${m.message}`);
      } else if (m.severity === 2) {
        errors.push(`${where} ${m.ruleId ?? ''} ${m.message}`.trim());
      } else {
        warnings.push({
          file,
          construct: m.ruleId ?? UNUSED_DIRECTIVE,
          line: m.line,
          column: m.column,
        });
      }
    }
  }
  return { warnings, errors, fatal, filesLinted: results.length };
}

export function countWarnings(warnings: Warning[]): SiteCounts {
  return countSites(warnings);
}

export function emptyBaseline(): WarningBaseline {
  return { sites: {} };
}

/** Throws on anything but a map of files to positive integer counts per rule. */
export function parseBaseline(raw: string): WarningBaseline {
  const parsed = JSON.parse(raw) as Partial<WarningBaseline>;
  const sites = parsed.sites;
  if (!isRecord(sites)) {
    throw new Error('warning baseline: "sites" must be an object');
  }
  for (const [file, perFile] of Object.entries(sites)) {
    if (!isRecord(perFile)) {
      throw new Error(`warning baseline: ${file} must map rules to counts`);
    }
    for (const [rule, count] of Object.entries(perFile)) {
      if (!Number.isInteger(count) || count < 1) {
        throw new Error(
          `warning baseline: ${file} ${rule} must be a positive integer`,
        );
      }
    }
  }
  return { sites };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function serializeBaseline(baseline: WarningBaseline): string {
  // lowerBaseline and countSites return their maps sorted.
  return `${JSON.stringify({ sites: baseline.sites }, null, 2)}\n`;
}

/** Warnings per rule, most first: the summary line and the trend report. */
export function totalsByRule(counts: SiteCounts): Array<[string, number]> {
  const totals = new Map<string, number>();
  for (const perFile of Object.values(counts)) {
    for (const [rule, n] of Object.entries(perFile)) {
      totals.set(rule, (totals.get(rule) ?? 0) + n);
    }
  }
  return [...totals].sort(([ra, a], [rb, b]) => b - a || ra.localeCompare(rb));
}

export function ratchetProblems(
  result: RatchetResult,
  warnings: Warning[] = [],
): string[] {
  const problems: string[] = [];
  const describe = (d: RatchetResult['grown'][number]) =>
    `  ${d.file} ${d.construct}: ${d.count} (baseline ${d.allowed})`;

  if (result.grown.length > 0) {
    const lines = result.grown.flatMap((d) => [
      describe(d),
      ...warnings
        .filter((w) => w.file === d.file && w.construct === d.construct)
        .map((w) => `    ${w.file}:${w.line}:${w.column}`),
    ]);
    problems.push(
      `${result.grown.length} file/rule warning counts exceed the baseline. Fix the new warnings:\n${lines.join('\n')}`,
    );
  }
  if (result.stale.length > 0) {
    problems.push(
      `${result.stale.length} baseline entries are above today's count. Lower them with npm run lint:ratchet -- --update:\n${result.stale.map(describe).join('\n')}`,
    );
  }
  if (result.added.length > 0) {
    problems.push(
      result.baseRefMissing
        ? `No base ref resolved, so the ${result.added.length} baseline entries cannot be shown not to be new. Fetch master or set WARNING_BASE_REF.`
        : `${result.added.length} baseline entries are above the base branch's: the baseline only shrinks.\n${result.added.map(describe).join('\n')}`,
    );
  }
  return problems;
}

/** Every ESLint error as one problem; errors fail outright, as in npm run lint. */
export function errorProblems(errors: string[]): string[] {
  if (errors.length === 0) return [];
  const lines = errors.map((e) => `  ${e}`).join('\n');
  return [`${errors.length} ESLint errors:\n${lines}`];
}

/**
 * What `--update` still fails on after writing the lowered baseline: ESLint
 * errors, and warnings above their entry, which an update never adds.
 */
export function updateProblems(
  current: SiteCounts,
  lowered: WarningBaseline,
  outcome: WarningOutcome,
): string[] {
  // A resolved ref with no base baseline skips the base-branch comparison,
  // which the pull request run still makes.
  const result = applyRatchet(current, lowered, {
    ref: 'update',
    baseline: null,
  });
  return [
    ...errorProblems(outcome.errors),
    ...ratchetProblems(result, outcome.warnings),
  ];
}

/** Problems that mean the check itself did not run properly, or lint failed outright. */
export function integrityProblems(outcome: WarningOutcome): string[] {
  const problems: string[] = [];
  if (outcome.filesLinted === 0) {
    problems.push('ESLint linted no files: the check compared nothing.');
  }
  if (outcome.fatal.length > 0) {
    const files = outcome.fatal.map((f) => `  ${f}`).join('\n');
    problems.push(
      `ESLint could not parse ${outcome.fatal.length} files, so they were not checked:\n${files}`,
    );
  }
  return problems;
}
