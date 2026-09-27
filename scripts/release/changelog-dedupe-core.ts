/**
 * Release notes without the lines a merge commit repeats (#377).
 *
 * GitHub's default merge commit carries the pull request's title as its body,
 * and release-please reads that body as a conventional commit of its own. A
 * pull request merged with a merge commit therefore shows up twice: once for
 * its own commit and once for the merge. `dropRepeatedEntries` removes the
 * merge's line when the branch it merged had a commit release-please lists
 * anyway, so nothing that shipped disappears.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/** Commit types release-please lists (release-please-config.json), plus breaking `!`. */
const LISTED = /^(feat|fix|chore|docs|test|refactor|perf)(\([^)]*\))?!?: \S/;

/** Whether release-please would list a commit with this subject. */
export function isListedSubject(subject: string): boolean {
  return LISTED.test(subject);
}

/**
 * The merge commits whose line is a repeat: each merge whose merged branch
 * holds at least one commit release-please lists. `branchSubjects` maps a
 * merge commit's full SHA to the subjects of the commits it brought in.
 */
export function repeatedMerges(
  branchSubjects: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  const repeats = new Set<string>();
  for (const [sha, subjects] of branchSubjects) {
    if (subjects.some(isListedSubject)) repeats.add(sha);
  }
  return repeats;
}

/** The full SHA a changelog bullet links to, if it links to a commit. */
export function commitOf(line: string): string | undefined {
  return /\/commit\/([0-9a-f]{40})\)/.exec(line)?.[1];
}

/**
 * `notes` without the bullets that link to a commit in `repeats`, and without
 * a `###` heading left with no bullets under it.
 */
export function dropRepeatedEntries(
  notes: string,
  repeats: ReadonlySet<string>,
): string {
  const kept = notes.split('\n').filter((line) => {
    if (!line.startsWith('* ')) return true;
    const sha = commitOf(line);
    return sha === undefined || !repeats.has(sha);
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
  repeats: ReadonlySet<string>,
): string {
  const start = changelog.search(/^## /m);
  if (start === -1) return changelog;
  const rest = changelog.slice(start + 3).search(/^## /m);
  const end = rest === -1 ? changelog.length : start + 3 + rest;
  return (
    changelog.slice(0, start) +
    dropRepeatedEntries(changelog.slice(start, end), repeats) +
    changelog.slice(end)
  );
}
