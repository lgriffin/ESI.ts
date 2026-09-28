/**
 * Release notes without the lines a merge commit repeats (#377).
 *
 * GitHub's default merge commit carries the pull request's title as its body,
 * and release-please reads that body as a conventional commit of its own. A
 * pull request merged with a merge commit therefore shows up twice: once for
 * its own commit and once for the merge. `dropRepeatedEntries` removes the
 * merge's line only when a commit on the branch it merged has exactly the
 * same subject and that commit's own line is in the same notes, so the change
 * is still listed. A pull request title that summarises differently named
 * commits keeps its line, and so does a merge whose branch commits
 * release-please left out (it does not always list them).
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/** Commit types release-please lists (release-please-config.json), plus breaking `!`. */
const LISTED = /^(feat|fix|chore|docs|test|refactor|perf)(\([^)]*\))?!?: \S/;

/** Whether release-please would list a commit with this subject. */
export function isListedSubject(subject: string): boolean {
  return LISTED.test(subject);
}

/** One commit: its full SHA and subject line. */
export interface CommitRef {
  readonly sha: string;
  readonly subject: string;
}

/** What `mergeTwins` needs to know about one merge commit. */
export interface MergeInfo {
  /** The body lines of the merge commit (GitHub puts the PR title there). */
  readonly body: readonly string[];
  /** The commits the merge brought in. */
  readonly branch: readonly CommitRef[];
}

/**
 * For each merge commit (keyed by full SHA) whose body lists something, and
 * whose every listed body line is also the subject of a commit on the merged
 * branch: one group per listed line, holding the SHAs of the commits with
 * that subject. A merge with a listed line no branch commit repeats has no
 * entry, so its line is always kept.
 */
export function mergeTwins(
  merges: ReadonlyMap<string, MergeInfo>,
): Map<string, string[][]> {
  const twins = new Map<string, string[][]>();
  for (const [sha, { body, branch }] of merges) {
    const listed = body.map((line) => line.trim()).filter(isListedSubject);
    const groups = listed.map((line) =>
      branch.filter((c) => c.subject === line).map((c) => c.sha),
    );
    if (groups.length > 0 && groups.every((group) => group.length > 0)) {
      twins.set(sha, groups);
    }
  }
  return twins;
}

/** The full SHA a changelog bullet links to, if it links to a commit. */
export function commitOf(line: string): string | undefined {
  return /\/commit\/([0-9a-f]{40})\)/.exec(line)?.[1];
}

/**
 * `notes` without the bullets of merge commits whose twins (`mergeTwins`)
 * all have a line of their own in `notes`, and without a `###` heading left
 * with nothing under it.
 */
export function dropRepeatedEntries(
  notes: string,
  twins: ReadonlyMap<string, readonly (readonly string[])[]>,
): string {
  const lines = notes.split('\n');
  const listed = new Set(
    lines
      .filter((l) => l.startsWith('* '))
      .map(commitOf)
      .filter(Boolean),
  );
  const repeated = (sha: string) =>
    twins.get(sha)?.every((group) => group.some((c) => listed.has(c))) ?? false;
  const kept = lines.filter((line) => {
    if (!line.startsWith('* ')) return true;
    const sha = commitOf(line);
    return sha === undefined || !repeated(sha);
  });
  return dropEmptySections(kept).join('\n');
}

function dropEmptySections(lines: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (line.startsWith('### ')) {
      let next = i + 1;
      while (next < lines.length && lines[next]!.trim() === '') next++;
      const body = lines[next];
      if (body === undefined || body.startsWith('#')) {
        // Skip the heading and the blank lines after it.
        i = next - 1;
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

/**
 * `changelog` with `dropRepeatedEntries` applied to its newest release only,
 * the section release-please is writing. Older releases are left as they are.
 */
export function dedupeNewestRelease(
  changelog: string,
  twins: ReadonlyMap<string, readonly (readonly string[])[]>,
): string {
  const start = changelog.search(/^## /m);
  if (start === -1) return changelog;
  const rest = changelog.slice(start + 3).search(/^## /m);
  const end = rest === -1 ? changelog.length : start + 3 + rest;
  return (
    changelog.slice(0, start) +
    dropRepeatedEntries(changelog.slice(start, end), twins) +
    changelog.slice(end)
  );
}
