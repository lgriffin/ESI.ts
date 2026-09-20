/**
 * SemVer gate for the public API report.
 *
 * `etc/esi.ts.api.md` is api-extractor's rendering of the package's public
 * surface, and the `api-surface` job already proves the committed copy matches
 * the code. This gate compares the committed report before and after a pull
 * request and asks one question: if the surface lost or changed a line, does
 * a commit in the pull request tell release-please to cut a major version?
 *
 * - A line that disappears is a removal or a signature change. Both break a
 *   consumer, so the gate wants `type!:` or a `BREAKING CHANGE:` footer.
 * - A line that only appears is an addition. Additions ship as a minor or a
 *   patch, so the gate passes without a marker.
 * - A change that removes a line but is compatible (an optional parameter
 *   added to a signature, say) can say so with an `API-Compatible: <reason>`
 *   trailer. The reason lands in the git history next to the change, where a
 *   reviewer and a later reader can both see it.
 *
 * The pull request has to survive either merge button. A merge commit keeps
 * every commit, so a marker on any one of them reaches release-please. A
 * squash merge of several commits takes its title from the pull request, and
 * release-please reads only that title's `!` and the message's last-paragraph
 * footers, so a breaking change also needs `type!:` in the pull request title.
 * A single-commit squash keeps that commit's message, so the commit suffices.
 *
 * Lines are compared as multisets rather than as an ordered diff, because
 * api-extractor orders some members differently on Windows and Linux (the
 * `api-surface` job sorts for the same reason).
 *
 * Pure functions, plus two small git readers that take a `cwd`, so the unit
 * suite can drive everything against fixtures and a throwaway repository.
 */
import { execFileSync } from 'child_process';

export const API_REPORT_PATH = 'etc/esi.ts.api.md';

export interface ReportDiff {
  /** Lines present before the change and missing after it. */
  removed: string[];
  /** Lines present after the change and missing before it. */
  added: string[];
}

export type Verdict =
  | 'unchanged'
  | 'additive'
  | 'breaking-declared'
  | 'compatible-declared'
  | 'breaking-undeclared'
  | 'breaking-title-undeclared';

export interface GateResult {
  ok: boolean;
  verdict: Verdict;
  /** Human-readable explanation, suitable for a log or a step summary. */
  message: string;
}

/**
 * Lines that carry no API meaning: blanks, api-extractor comments and
 * warnings, `import` lines (they follow whatever the declarations reference),
 * and lines made only of brackets and separators (they follow the
 * declarations they close).
 */
function isNoise(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === '') return true;
  if (trimmed.startsWith('//')) return true;
  if (trimmed.startsWith('import ')) return true;
  return /^[{}()[\];,]+$/.test(trimmed);
}

/** The report's meaningful lines, with CRLF and trailing whitespace removed. */
export function reportLines(report: string): string[] {
  return report
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .filter((line) => !isNoise(line));
}

function countLines(lines: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines) counts.set(line, (counts.get(line) ?? 0) + 1);
  return counts;
}

function subtract(
  from: Map<string, number>,
  take: Map<string, number>,
): string[] {
  const out: string[] = [];
  for (const [line, count] of from) {
    const left = count - (take.get(line) ?? 0);
    for (let i = 0; i < left; i++) out.push(line);
  }
  return out;
}

/** Multiset difference of the two reports' meaningful lines. */
export function diffReports(base: string, head: string): ReportDiff {
  const baseCounts = countLines(reportLines(base));
  const headCounts = countLines(reportLines(head));
  return {
    removed: subtract(baseCounts, headCounts),
    added: subtract(headCounts, baseCounts),
  };
}

/** `feat!:`, `fix(scope)!:` and so on: the Conventional Commits `!` marker. */
const BREAKING_HEADER = /^[a-z]+(\([^)]*\))?!: \S/i;
/** A `BREAKING CHANGE:` or `BREAKING-CHANGE:` footer with a description. */
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE: *\S/m;
/** The opt-out trailer for a removal that does not break consumers. */
const COMPATIBLE_TRAILER = /^API-Compatible: *(\S.*)$/im;

export function isBreakingCommit(message: string): boolean {
  const header = message.split('\n', 1)[0] ?? '';
  return BREAKING_HEADER.test(header) || BREAKING_FOOTER.test(message);
}

/** The reason given in an `API-Compatible:` trailer, or null if there is none. */
export function compatibleReason(message: string): string | null {
  const match = COMPATIBLE_TRAILER.exec(message);
  return match ? match[1]!.trim() : null;
}

const MAX_LINES_SHOWN = 20;

function listLines(lines: string[]): string {
  const shown = lines.slice(0, MAX_LINES_SHOWN).map((l) => `    ${l.trim()}`);
  if (lines.length > MAX_LINES_SHOWN) {
    shown.push(`    … and ${lines.length - MAX_LINES_SHOWN} more`);
  }
  return shown.join('\n');
}

function subject(message: string): string {
  return (message.split('\n', 1)[0] ?? '').trim();
}

export interface GateOptions {
  /**
   * The pull request title, which a squash merge of several commits uses as
   * the commit title. Null or omitted when there is no pull request (a local
   * run), which skips the title check.
   */
  prTitle?: string | null;
}

/**
 * Decide whether a pull request's commits declare what its API report change
 * does. `commitMessages` are the full messages of the commits the pull
 * request adds to the base branch.
 */
export function evaluateGate(
  diff: ReportDiff,
  commitMessages: string[],
  options: GateOptions = {},
): GateResult {
  if (diff.removed.length === 0 && diff.added.length === 0) {
    return {
      ok: true,
      verdict: 'unchanged',
      message: 'The public API report did not change.',
    };
  }

  if (diff.removed.length === 0) {
    return {
      ok: true,
      verdict: 'additive',
      message: `The public API report only gained lines (${diff.added.length}). Additions need no breaking-change marker.`,
    };
  }

  const breaking = commitMessages.filter(isBreakingCommit);
  const { prTitle } = options;
  if (
    breaking.length > 0 &&
    commitMessages.length > 1 &&
    prTitle != null &&
    !BREAKING_HEADER.test(prTitle.trim())
  ) {
    return {
      ok: false,
      verdict: 'breaking-title-undeclared',
      message: [
        `The public API report lost or changed ${diff.removed.length} line(s), and a commit declares the break:`,
        ...breaking.map((m) => `  - ${subject(m)}`),
        `but the pull request title does not: "${prTitle.trim()}".`,
        '',
        `A squash merge of these ${commitMessages.length} commits uses the title as the commit release-please reads,`,
        'so it would ship as a minor or a patch. Mark the title breaking (`feat!: …`), then re-run this job.',
      ].join('\n'),
    };
  }
  if (breaking.length > 0) {
    return {
      ok: true,
      verdict: 'breaking-declared',
      message: [
        `The public API report lost or changed ${diff.removed.length} line(s), and the pull request declares a breaking change in:`,
        ...breaking.map((m) => `  - ${subject(m)}`),
      ].join('\n'),
    };
  }

  const compatible = commitMessages
    .map((m) => ({ m, reason: compatibleReason(m) }))
    .filter((c): c is { m: string; reason: string } => c.reason !== null);
  if (compatible.length > 0) {
    return {
      ok: true,
      verdict: 'compatible-declared',
      message: [
        `The public API report lost or changed ${diff.removed.length} line(s). A commit declares the change compatible:`,
        ...compatible.map((c) => `  - ${subject(c.m)}: ${c.reason}`),
        'Removed or changed lines:',
        listLines(diff.removed),
      ].join('\n'),
    };
  }

  return {
    ok: false,
    verdict: 'breaking-undeclared',
    message: [
      `The public API report lost or changed ${diff.removed.length} line(s), but no commit in this pull request declares a breaking change.`,
      'Removed or changed lines:',
      listLines(diff.removed),
      '',
      'release-please would ship this as a minor or a patch. Either:',
      '  - mark a commit as breaking (`feat!: …`, `fix!: …`, or a `BREAKING CHANGE: …` footer), or',
      '  - if no consumer can break (for example an optional parameter was added), add an',
      '    `API-Compatible: <why>` trailer to a commit.',
    ].join('\n'),
  };
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Resolve a revision to a commit id, failing with a readable message. */
export function resolveRevision(rev: string, cwd: string): string {
  try {
    return git(['rev-parse', '--verify', `${rev}^{commit}`], cwd).trim();
  } catch {
    throw new Error(
      `Cannot resolve revision "${rev}". In CI the checkout needs fetch-depth: 0 and a pull request merge commit.`,
    );
  }
}

/** The API report at a revision, or '' if the file does not exist there. */
export function readReportAt(rev: string, cwd: string): string {
  const commit = resolveRevision(rev, cwd);
  try {
    return git(['show', `${commit}:${API_REPORT_PATH}`], cwd);
  } catch {
    return '';
  }
}

/** Full messages of the commits reachable from `head` but not from `base`. */
export function readCommitMessages(
  base: string,
  head: string,
  cwd: string,
): string[] {
  const range = `${resolveRevision(base, cwd)}..${resolveRevision(head, cwd)}`;
  return git(['log', '--format=%B%x00', range], cwd)
    .split('\0')
    .map((m) => m.trim())
    .filter((m) => m !== '');
}
