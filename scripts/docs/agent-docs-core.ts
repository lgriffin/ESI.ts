/**
 * Keeping CLAUDE.md and AGENTS.md from drifting apart.
 *
 * Both files are read by agents as instructions, and several sections appear
 * in both — most importantly `Semantic Versioning (enforced)`, which says when
 * a change is major, when a break needs the user's approval, and how it must
 * be marked. The Beads block at the foot of each file asks whoever edits one
 * to "mirror substantive edits across both", which is exactly the kind of
 * instruction that decays: the two copies are identical today only because
 * nobody has yet edited one and forgotten the other.
 *
 * A rule that lives in two places and is enforced in neither is a rule that
 * will eventually contradict itself, and an agent reading the stale copy will
 * ship a breaking change under `fix:`. This is the check that stops that.
 *
 * Pure functions with no I/O, so the unit suite can import them.
 */

/**
 * The sections that must read the same in both files.
 *
 * Only what this repository writes. `Beads Issue Tracker`, `Agent Context
 * Profiles` and `Session Completion` all sit inside the managed block that
 * `bd setup claude` and `bd setup codex` generate, and those two generators
 * legitimately differ — AGENTS.md's copy carries `bd dolt push` and a second
 * generated block that CLAUDE.md's does not. Holding generated text to a
 * byte-identical mirror would fail on the generator, not on a drifting rule.
 *
 * `Semantic Versioning (enforced)` is the section worth pinning: it decides
 * when a change is major, that a break needs the user's approval, and how the
 * commit is marked. Add a section here when this repository owns both copies.
 */
export const MIRRORED_SECTIONS = ['Semantic Versioning (enforced)'];

/**
 * Every `## ` section body, keyed by heading. A heading that appears twice
 * gets both bodies, so the caller can say so rather than silently taking the
 * first.
 */
export function sectionsOf(markdown: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const pattern = /^## (.+)$/gm;
  const starts: { heading: string; from: number }[] = [];
  for (const match of markdown.matchAll(pattern)) {
    starts.push({
      heading: match[1]?.trim() ?? '',
      from: (match.index ?? 0) + match[0].length,
    });
  }
  starts.forEach((start, i) => {
    const end =
      i + 1 < starts.length ? (starts[i + 1]?.from ?? 0) : markdown.length;
    const nextHeadingStart = markdown.lastIndexOf('\n## ', end);
    const body = markdown
      .slice(start.from, i + 1 < starts.length ? nextHeadingStart : end)
      .trim();
    const bodies = found.get(start.heading) ?? [];
    bodies.push(body);
    found.set(start.heading, bodies);
  });
  return found;
}

/** What is wrong, one line each; empty means the two files agree. */
export function mirrorProblems(
  claude: string,
  agents: string,
  headings: string[] = MIRRORED_SECTIONS,
): string[] {
  const problems: string[] = [];
  const left = sectionsOf(claude);
  const right = sectionsOf(agents);

  for (const heading of headings) {
    const inClaude = left.get(heading);
    const inAgents = right.get(heading);

    for (const [file, bodies] of [
      ['CLAUDE.md', inClaude],
      ['AGENTS.md', inAgents],
    ] as const) {
      if (bodies === undefined) {
        problems.push(
          `${file} has no "## ${heading}" section; both files carry it`,
        );
      } else if (bodies.length > 1) {
        problems.push(
          `${file} has ${bodies.length} "## ${heading}" sections; which one is normative is then a guess`,
        );
      }
    }

    if (inClaude?.length === 1 && inAgents?.length === 1) {
      if (inClaude[0] !== inAgents[0]) {
        problems.push(
          `"## ${heading}" differs between CLAUDE.md and AGENTS.md; an agent reading one would follow a rule the other does not state`,
        );
      }
    }
  }

  return problems;
}
