/**
 * Requirement-language and exception-list checks for the EARS spec audit.
 *
 * These are the parts of `spec-audit.ts` that reason about strings and the
 * exception file rather than about a Gherkin AST. They live here because
 * `@cucumber/gherkin` is ESM-only: anything that imports it cannot be loaded
 * by Jest's CommonJS runtime, so keeping these checks free of that dependency
 * is what lets the audit's own unit tests import them directly.
 */

import { existsSync, readFileSync } from 'fs';
import { execFileSync } from 'child_process';
import * as path from 'path';

export const EXCEPTIONS_PATH = path.resolve(
  __dirname,
  'spec-audit-exceptions.json',
);
export const REPO_ROOT = path.resolve(__dirname, '../..');

// ---------------------------------------------------------------------------
// Requirement language rules
// ---------------------------------------------------------------------------

/**
 * Words that make a requirement untestable. A requirement containing any of
 * these cannot be verified, because two readers will disagree on whether the
 * system met it.
 */
export const VAGUE_TERMS: Readonly<Record<string, readonly string[]>> = {
  'vague adverb': [
    'quickly',
    'slowly',
    'efficiently',
    'properly',
    'reasonably',
    'approximately',
    'usually',
    'typically',
    'generally',
    'soon',
    'eventually',
    'immediately',
    'gracefully',
    'correctly',
    'appropriately',
  ],
  'unmeasurable adjective': [
    'user-friendly',
    'flexible',
    'intuitive',
    'robust',
    'scalable',
    'efficient',
    'seamless',
    'responsive',
    'reliable',
    'powerful',
    'smart',
    'easy-to-use',
    'graceful',
  ],
  'vague quantifier': [
    'various',
    'some',
    'many',
    'few',
    'several',
    'most',
    'a lot',
  ],
  'escape clause': [
    'as appropriate',
    'if possible',
    'as needed',
    'where practical',
    'to the extent feasible',
    'if necessary',
    'when applicable',
  ],
  'continuation term': ['etc.', 'and so on', 'and/or', 'such as'],
  'indefinite temporal term': [
    'timely',
    'in a timely manner',
    'in real time',
    'promptly',
    'without delay',
    'as soon as possible',
    'periodic',
  ],
};

/** EARS reserves "shall" for mandatory behaviour; these dilute it. */
export const WRONG_OBLIGATION_KEYWORDS: readonly string[] = [
  'should',
  'may',
  'will',
  'must',
];

/** A requirement must name the system it constrains, not point at it. */
export const PRONOUNS_BEFORE_SHALL: readonly string[] = [
  'it',
  'they',
  'he',
  'she',
  'we',
  'you',
];

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function countShall(text: string): number {
  return (text.match(/\bshall\b/gi) ?? []).length;
}

export function findWrongObligationKeywords(title: string): string[] {
  const pattern = new RegExp(
    `\\b(${WRONG_OBLIGATION_KEYWORDS.join('|')})\\b`,
    'gi',
  );
  const matches = title.match(pattern) ?? [];
  return [...new Set(matches.map((m) => m.toLowerCase()))].sort();
}

export function findVagueTerms(title: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  for (const [category, terms] of Object.entries(VAGUE_TERMS)) {
    for (const term of terms) {
      const escaped = escapeRegExp(term);
      // A trailing "." already terminates the word, so no closing boundary.
      const pattern = term.endsWith('.')
        ? new RegExp(`\\b${escaped}`, 'i')
        : new RegExp(`\\b${escaped}\\b`, 'i');
      if (pattern.test(title)) {
        found.push([term, category]);
      }
    }
  }
  return found;
}

/**
 * Check EARS structural grammar.
 *
 * The templates are:
 *   If <condition>, then the <system> shall <response>.
 *   While <state>, the <system> shall <response>.
 *   When <trigger>, the <system> shall <response>.
 *   Where <feature is included>, the <system> shall <response>.
 */
export function checkEarsPatternStructure(title: string): string[] {
  const errors: string[] = [];
  const lower = title.toLowerCase();

  const ifMatch = /^\s*if\b/.exec(lower);
  if (ifMatch) {
    const shallPos = lower.indexOf('shall');
    const thenMatch = /\bthen\b/.exec(lower);
    const thenPos = thenMatch ? thenMatch.index : -1;
    if (shallPos !== -1 && (thenPos === -1 || thenPos > shallPos)) {
      errors.push(
        "EARS 'If' pattern requires 'then' before 'shall' " +
          '(template: If <condition>, then the <system> shall <response>).',
      );
    } else if (thenPos !== -1) {
      // 'then' is in the right place, so the clause before it has to be a
      // real, comma-delimited condition. Without the comma the title reads as
      // one run-on phrase and the condition stops being separable from the
      // response, which is the whole point of the pattern.
      const condition = lower.slice(ifMatch[0].length, thenPos);
      if (!/,\s*$/.test(condition)) {
        errors.push(
          "EARS 'If' pattern requires a comma before 'then' " +
            '(template: If <condition>, then the <system> shall <response>).',
        );
      } else if (condition.replace(/,\s*$/, '').trim().length === 0) {
        errors.push(
          "EARS 'If' pattern requires a condition between 'If' and ', then' " +
            '(template: If <condition>, then the <system> shall <response>).',
        );
      }
    }
  }

  for (const keyword of ['while', 'when', 'where']) {
    if (new RegExp(`^\\s*${keyword}\\b`).test(lower)) {
      const keywordEnd = lower.indexOf(keyword) + keyword.length;
      const beforeShall = lower.includes('shall')
        ? lower.slice(0, lower.indexOf('shall'))
        : lower;
      if (!beforeShall.slice(keywordEnd).includes(',')) {
        const capitalised = keyword[0]!.toUpperCase() + keyword.slice(1);
        errors.push(
          `EARS '${capitalised}' clause should be followed by a comma before ` +
            `the system name (template: ${capitalised} <clause>, the <system> ` +
            `shall <response>).`,
        );
      }
      break;
    }
  }

  return errors;
}

export function checkMissingSystemName(title: string): string[] {
  const pattern = new RegExp(
    `\\b(${PRONOUNS_BEFORE_SHALL.join('|')})\\s+shall\\b`,
    'i',
  );
  const match = pattern.exec(title);
  if (match) {
    return [
      `Pronoun '${match[1]!.toLowerCase()}' found before 'shall' — use an ` +
        'explicit system name.',
    ];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Exception list
// ---------------------------------------------------------------------------

export interface Exceptions {
  /** Feature files not yet converted to Rule form. Ratcheted: can only shrink. */
  unconverted: string[];
  /**
   * Multi-step `defineFeature` step files not yet split into tests/bdd/steps.
   * Ratcheted the same way; see `spec-audit-steps.ts`.
   */
  legacyStepFiles: string[];
  /**
   * Feature files no charter requirement covers, so they carry no charter
   * tag. Ratcheted the same way; see `checkUnchartedList`.
   */
  unchartedFeatures: string[];
}

export function loadExceptions(): Exceptions {
  if (!existsSync(EXCEPTIONS_PATH)) {
    return { unconverted: [], legacyStepFiles: [], unchartedFeatures: [] };
  }
  const parsed = JSON.parse(readFileSync(EXCEPTIONS_PATH, 'utf-8')) as Partial<
    Exceptions & { $comment?: string }
  >;
  return {
    unconverted: parsed.unconverted ?? [],
    legacyStepFiles: parsed.legacyStepFiles ?? [],
    unchartedFeatures: parsed.unchartedFeatures ?? [],
  };
}

/**
 * The exception list as it stands on the integration branch.
 *
 * The list is a ratchet in both directions: an entry that starts passing must
 * be removed, and an entry that was never there must not appear. Comparing
 * against the committed baseline is what makes the second half enforceable —
 * otherwise a PR can exempt its own feature file.
 *
 * When no baseline ref resolves — a shallow CI checkout, a published tarball,
 * no git at all — the baseline is empty, so every entry reads as an addition.
 * That fails closed, which is the right direction for a ratchet.
 */
export function loadBaselineExceptions(): {
  entries: Set<string>;
  /**
   * `legacyStepFiles` on the integration branch, or null when that branch's
   * file has no such key yet — the one state in which additions cannot be
   * told apart from the list being introduced.
   */
  legacyStepFiles: Set<string> | null;
  /** `unchartedFeatures` on the integration branch, or null when it has none yet. */
  unchartedFeatures: Set<string> | null;
  ref: string | null;
} {
  const relPath = path
    .relative(REPO_ROOT, EXCEPTIONS_PATH)
    .split(path.sep)
    .join('/');
  const refs = [
    process.env.SPEC_AUDIT_BASE_REF,
    'origin/master',
    'master',
  ].filter((ref): ref is string => Boolean(ref));

  for (const ref of refs) {
    let raw: string;
    try {
      raw = execFileSync('git', ['show', `${ref}:${relPath}`], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      continue; // Ref not available in this checkout; try the next one.
    }
    try {
      const parsed = JSON.parse(raw) as Partial<Exceptions>;
      return {
        entries: new Set(parsed.unconverted ?? []),
        legacyStepFiles: Array.isArray(parsed.legacyStepFiles)
          ? new Set(parsed.legacyStepFiles)
          : null,
        unchartedFeatures: Array.isArray(parsed.unchartedFeatures)
          ? new Set(parsed.unchartedFeatures)
          : null,
        ref,
      };
    } catch {
      continue; // Baseline file is unparseable; treat it as absent.
    }
  }

  return {
    entries: new Set(),
    legacyStepFiles: new Set(),
    unchartedFeatures: new Set(),
    ref: null,
  };
}

export interface ExceptionProblems {
  /** Entries absent from the baseline — the list grew. */
  added: string[];
  /** Entries that no longer name a feature file on disk. */
  dangling: string[];
}

/**
 * The two ways an exception list rots without anyone noticing: a PR exempts
 * its own feature file, or a file is deleted and its entry outlives it,
 * quietly making the list look longer than the remaining work.
 */
export function checkExceptionList(
  unconverted: string[],
  baseline: Set<string>,
): ExceptionProblems {
  const added: string[] = [];
  const dangling: string[] = [];

  for (const rel of unconverted) {
    if (!baseline.has(rel)) {
      added.push(rel);
    }
    if (
      !rel.endsWith('.feature') ||
      !existsSync(path.resolve(REPO_ROOT, rel))
    ) {
      dangling.push(rel);
    }
  }

  return { added, dangling };
}

// ---------------------------------------------------------------------------
// Bug tags
// ---------------------------------------------------------------------------

export const BEADS_EXPORT_PATH = path.resolve(
  REPO_ROOT,
  '.beads',
  'issues.jsonl',
);

/**
 * A tag naming where a bug is tracked: a bead (`@esi-23g.11`) or a GitHub
 * issue (`@gh-123`). Bead ids are `esi-` followed by dot-separated lower-case
 * alphanumeric segments.
 */
const BEAD_TAG = /^@(esi-[a-z0-9]+(?:\.[a-z0-9]+)*)$/;
const GITHUB_TAG = /^@gh-[1-9]\d*$/;

/**
 * Every bead id in the committed beads export, or null when the export is
 * absent or unreadable, so a caller can refuse to accept an id it cannot
 * check rather than accepting it unchecked.
 */
export function loadBeadIds(
  file: string = BEADS_EXPORT_PATH,
): Set<string> | null {
  let raw: string;
  try {
    raw = readFileSync(file, 'utf-8');
  } catch {
    return null;
  }
  const ids = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    if (line.trim().length === 0) continue;
    try {
      const record = JSON.parse(line) as { id?: unknown };
      if (typeof record.id === 'string') ids.add(record.id);
    } catch {
      // A malformed line names no bead; the ids around it still count.
    }
  }
  return ids;
}

/**
 * Findings for one tagged element: a Feature, Rule, Scenario or Examples
 * block. `tags` are the element's own; `inherited` are its ancestors', which
 * Gherkin applies to it, so a tracker tag on a Rule covers `@bug` on each of
 * its scenarios. A `@bug` with no tracker is a known defect nobody can find
 * the history of, and a bead id the export does not know is a dead link.
 */
export function checkBugTags(
  tags: readonly string[],
  inherited: readonly string[],
  knownBeads: ReadonlySet<string> | null,
): string[] {
  const errors: string[] = [];
  const all = [...inherited, ...tags];

  if (tags.includes('@bug')) {
    const trackers = all.filter((t) => BEAD_TAG.test(t) || GITHUB_TAG.test(t));
    if (trackers.length === 0) {
      errors.push(
        'Tagged @bug with no tracker tag. Add the bead or issue that tracks ' +
          'it beside @bug: @esi-<id> for a bead, @gh-<number> for a GitHub issue.',
      );
    }
  }

  for (const tag of tags) {
    const bead = BEAD_TAG.exec(tag)?.[1];
    if (!bead) continue;
    if (knownBeads === null) {
      errors.push(
        `Tag ${tag} names a bead, but .beads/issues.jsonl could not be read, ` +
          'so the reference cannot be checked. Restore the beads export.',
      );
    } else if (!knownBeads.has(bead)) {
      errors.push(
        `Tag ${tag} names no bead in .beads/issues.jsonl. File the bead and ` +
          'commit the refreshed export in the same change, or correct the id.',
      );
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Charter tags
// ---------------------------------------------------------------------------

export const CHARTER_PATH = path.resolve(REPO_ROOT, 'guides', 'CHARTER.md');

/**
 * A tag naming a requirement of `guides/CHARTER.md`: `@DES-08`, `@SEC-10`.
 * Upper case, so it cannot be mistaken for a security-model tag (`@sec-P4`)
 * or a bead (`@esi-23g`).
 */
export const CHARTER_TAG = /^@([A-Z]+-\d+)$/;

/** The charter requirement ids among `tags`, without the `@`, once each, in order. */
export function charterIds(tags: readonly string[]): string[] {
  const ids = tags
    .map((tag) => CHARTER_TAG.exec(tag)?.[1])
    .filter((id): id is string => id !== undefined);
  return [...new Set(ids)];
}

/** One `#### <ID> · <kind> · <status>` heading per requirement. */
const CHARTER_HEADING = /^####\s+([A-Z]+-\d+)\s+·/;

/** Every requirement id the charter text defines. */
export function parseCharterIds(text: string): Set<string> {
  const ids = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const id = CHARTER_HEADING.exec(line)?.[1];
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Every requirement id in `guides/CHARTER.md`, or null when the charter cannot
 * be read, so a caller refuses a tag it cannot check rather than accepting it.
 */
export function loadCharterIds(
  file: string = CHARTER_PATH,
): Set<string> | null {
  try {
    return parseCharterIds(readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Findings for the tags of one element: each charter tag must name a
 * requirement the charter defines. A tag naming a retired or mistyped id is a
 * trace that leads nowhere.
 */
export function checkCharterTags(
  tags: readonly string[],
  known: ReadonlySet<string> | null,
): string[] {
  const errors: string[] = [];
  for (const tag of tags) {
    const id = /^@([A-Za-z]+-\d+)$/.exec(tag)?.[1];
    if (id && !CHARTER_TAG.test(tag) && known?.has(id.toUpperCase())) {
      errors.push(
        `Tag ${tag} names charter requirement ${id.toUpperCase()} in the ` +
          `wrong case. Write it as @${id.toUpperCase()}.`,
      );
    }
  }
  for (const id of charterIds(tags)) {
    if (known === null) {
      errors.push(
        `Tag @${id} names a charter requirement, but guides/CHARTER.md could ` +
          'not be read, so the reference cannot be checked.',
      );
    } else if (!known.has(id)) {
      errors.push(
        `Tag @${id} names no requirement in guides/CHARTER.md. Use the id of ` +
          'a "#### <ID> · <kind> · <status>" block, or correct the tag.',
      );
    }
  }
  return errors;
}

/**
 * The feature files a requirement's "Verified by" line names, as
 * `[id, feature path]` pairs. A requirement that cites a feature as its
 * evidence while the feature does not carry the requirement's tag is a trace
 * that holds in one direction only.
 */
export function charterFeatureCitations(text: string): Array<[string, string]> {
  const citations: Array<[string, string]> = [];
  let id: string | null = null;
  for (const line of text.split(/\r?\n/)) {
    const heading = CHARTER_HEADING.exec(line);
    if (heading) {
      id = heading[1]!;
      continue;
    }
    if (/^#{1,3}\s/.test(line)) id = null;
    if (!id || !/^\s*-\s+\*\*Verified by:\*\*/.test(line)) continue;
    for (const match of line.matchAll(
      /tests\/bdd\/features\/[\w./-]+\.feature/g,
    )) {
      citations.push([id, match[0]]);
    }
  }
  return citations;
}

export interface UnchartedProblems {
  /** Entries absent from the baseline: the list grew. */
  added: string[];
  /** Entries that do not name a feature file on disk. */
  dangling: string[];
  /** Entries whose feature now carries a charter tag. */
  stale: string[];
}

/**
 * `unchartedFeatures` names the features no charter requirement covers. It
 * is a ratchet like `unconverted`: an entry may not be added against the
 * integration branch (unless that branch has no such list yet, the null
 * baseline), must name a feature file, and must come out once its feature
 * carries a charter tag.
 */
export function checkUnchartedList(
  listed: readonly string[],
  baseline: ReadonlySet<string> | null,
  tagged: ReadonlySet<string>,
  exists: (rel: string) => boolean = (rel) =>
    existsSync(path.resolve(REPO_ROOT, rel)),
): UnchartedProblems {
  const problems: UnchartedProblems = { added: [], dangling: [], stale: [] };
  for (const rel of listed) {
    if (baseline && !baseline.has(rel)) problems.added.push(rel);
    if (!rel.endsWith('.feature') || !exists(rel)) problems.dangling.push(rel);
    else if (tagged.has(rel)) problems.stale.push(rel);
  }
  return problems;
}
