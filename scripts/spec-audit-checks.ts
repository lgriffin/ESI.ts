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
export const REPO_ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Requirement language rules
// ---------------------------------------------------------------------------

/**
 * Words that make a requirement untestable. A requirement containing any of
 * these cannot be verified, because two readers will disagree on whether the
 * system met it.
 */
const VAGUE_TERMS: Record<string, string[]> = {
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
const WRONG_OBLIGATION_KEYWORDS = ['should', 'may', 'will', 'must'];

/** A requirement must name the system it constrains, not point at it. */
const PRONOUNS_BEFORE_SHALL = ['it', 'they', 'he', 'she', 'we', 'you'];

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
}

export function loadExceptions(): Exceptions {
  if (!existsSync(EXCEPTIONS_PATH)) {
    return { unconverted: [], legacyStepFiles: [] };
  }
  const parsed = JSON.parse(readFileSync(EXCEPTIONS_PATH, 'utf-8')) as Partial<
    Exceptions & { $comment?: string }
  >;
  return {
    unconverted: parsed.unconverted ?? [],
    legacyStepFiles: parsed.legacyStepFiles ?? [],
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
        ref,
      };
    } catch {
      continue; // Baseline file is unparseable; treat it as absent.
    }
  }

  return { entries: new Set(), legacyStepFiles: new Set(), ref: null };
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
