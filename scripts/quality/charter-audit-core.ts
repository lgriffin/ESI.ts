/**
 * The charter audit: `guides/CHARTER.md` held to the rules the spec audit
 * applies to a `Rule:` block (CHARTER PROC-06).
 *
 * Every `#### <ID> · <pattern> · <status>` block is a requirement. Its first
 * paragraph is the requirement text, and the `- **Verified by:**` bullet names
 * the mechanism. The audit checks:
 *
 *   - the header: an id of the form PREFIX-NN, one of the five EARS patterns,
 *     one of the four statuses, and no id used twice;
 *   - the text: exactly one `shall`, no wrong obligation keyword, no vague
 *     term, EARS structure for `If`/`When`/`While`/`Where`, no pronoun for
 *     the system, and a leading keyword that agrees with the declared
 *     pattern;
 *   - an Enforced block: its "Verified by" names at least one mechanism that
 *     exists: an npm script (`npm run x`), a job or workflow in
 *     `.github/workflows/`, a path in the repository, or a GitHub setting
 *     the repository cannot hold in a file (branch protection).
 *
 * Pure: the caller supplies the Markdown and what exists (scripts, jobs,
 * workflows, tracked files), so the unit suite can drive it with fixtures.
 * `scripts/quality/charter-audit.ts` is the command around it.
 */
import {
  checkEarsPatternStructure,
  checkMissingSystemName,
  countShall,
  findVagueTerms,
  findWrongObligationKeywords,
} from '../spec/spec-audit-checks';

export const PATTERNS = [
  'Ubiquitous',
  'Event-driven',
  'State-driven',
  'Optional',
  'Unwanted',
] as const;
export type CharterPattern = (typeof PATTERNS)[number];

export const STATUSES = ['Enforced', 'Practised', 'Partial', 'Gap'] as const;
export type CharterStatus = (typeof STATUSES)[number];

/**
 * Mechanisms that live in GitHub's settings rather than in a file, so no
 * path, script or job can name them. An Enforced row cites one in backticks
 * (\`branch protection\`), like any other mechanism; a passing mention in
 * prose does not count. Anything else must exist in the repository.
 */
export const EXTERNAL_MECHANISMS = ['branch protection'] as const;

export interface CharterBlock {
  id: string;
  pattern: string;
  status: string;
  /** Every `·`-separated field of the header; a well-formed header has three. */
  fields: string[];
  /** 1-based line of the `####` header. */
  line: number;
  /** The requirement: the first paragraph under the header. */
  text: string;
  /** Prose after the first paragraph and before the bullets, joined. */
  rest: string;
  /** The `Verified by` bullet without its label, or '' when absent. */
  verifiedBy: string;
}

export interface CharterFinding {
  id: string;
  line: number;
  message: string;
}

/** What exists, for the "Verified by" check. */
export interface Mechanisms {
  /** `package.json` script names. */
  scripts: ReadonlySet<string>;
  /** Job ids and job display names across `.github/workflows/*.yml`. */
  jobs: ReadonlySet<string>;
  /** Workflow file names, e.g. `ci.yml`. */
  workflows: ReadonlySet<string>;
  /** Repository-relative paths of tracked files, forward slashes. */
  files: readonly string[];
}

// A Markdown heading may be indented by up to three spaces.
const HEADER = /^ {0,3}####\s+(.+?)\s*$/;
const ANY_HEADING = /^ {0,3}#{1,6}\s/;
const RULE = /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^ {0,3}(```|~~~)/;
const BULLET = /^\s*[-*]\s/;

/**
 * Parse every `####` requirement block of the charter, in file order. Lines
 * inside a fenced code block are prose examples, never headers or block
 * boundaries.
 */
export function parseCharter(markdown: string): CharterBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: CharterBlock[] = [];
  let fenced = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (FENCE.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const header = HEADER.exec(line);
    if (!header) continue;
    const fields = header[1]!.split('·').map((p) => p.trim());
    const [id = '', pattern = '', status = ''] = fields;

    // The block runs to the next heading of any level or a rule, fences
    // aside.
    let end = i + 1;
    let innerFence = false;
    while (end < lines.length) {
      const l = lines[end] ?? '';
      if (FENCE.test(l)) innerFence = !innerFence;
      else if (!innerFence && (ANY_HEADING.test(l) || RULE.test(l))) break;
      end += 1;
    }
    const body = lines.slice(i + 1, end);

    const { text, rest } = paragraphs(body);
    const verified = body.find((l) => /^\s*-\s+\*\*Verified by:\*\*/.test(l));
    const verifiedBy = verified
      ? verified.replace(/^\s*-\s+\*\*Verified by:\*\*\s*/, '').trim()
      : '';

    blocks.push({
      id,
      pattern,
      status,
      fields,
      line: i + 1,
      text,
      rest,
      verifiedBy,
    });
    i = end - 1;
  }
  return blocks;
}

/**
 * The first paragraph (the requirement) and the prose after it up to the
 * first bullet (which the audit holds free of further obligations). Fenced
 * code inside the block is an example and is left out of both.
 */
function paragraphs(body: readonly string[]): { text: string; rest: string } {
  const first: string[] = [];
  const rest: string[] = [];
  let state: 'before' | 'first' | 'rest' | 'done' = 'before';
  let fenced = false;
  for (const line of body) {
    if (FENCE.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const blank = line.trim().length === 0;
    if (state === 'before') {
      if (blank) continue;
      if (BULLET.test(line)) break;
      state = 'first';
      first.push(line.trim());
    } else if (state === 'first') {
      if (BULLET.test(line)) break;
      if (blank) state = 'rest';
      else first.push(line.trim());
    } else if (state === 'rest') {
      if (BULLET.test(line)) break;
      if (!blank) rest.push(line.trim());
    }
  }
  return { text: first.join(' '), rest: rest.join(' ') };
}

/**
 * The jobs a workflow file defines: the keys directly under `jobs:` and each
 * job's `name`. Trigger keys under `on:` and other top-level maps are not
 * jobs and are not collected.
 */
export function workflowJobs(yaml: string): string[] {
  const jobs: string[] = [];
  let inJobs = false;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^\S/.test(line)) {
      inJobs = /^jobs:\s*(#.*)?$/.test(line);
      continue;
    }
    if (!inJobs) continue;
    const id = /^  ([A-Za-z0-9_-]+):\s*(#.*)?$/.exec(line);
    if (id) jobs.push(id[1]!);
    const name = /^    name:\s*(['"]?)(.+?)\1\s*(#.*)?$/.exec(line);
    if (name) jobs.push(name[2]!);
  }
  return jobs;
}

/** The EARS pattern the text's leading keyword announces. */
function leadingPattern(text: string): CharterPattern {
  const lower = text.trim().toLowerCase();
  if (/^if\b/.test(lower)) return 'Unwanted';
  if (/^when\b/.test(lower)) return 'Event-driven';
  if (/^while\b/.test(lower)) return 'State-driven';
  if (/^where\b/.test(lower)) return 'Optional';
  return 'Ubiquitous';
}

/**
 * The requirement as prose: code spans dropped (a template quoted in
 * backticks is not an obligation), the word _shall_ cited in italics dropped
 * (TEST-02 talks about the keyword), and emphasis markers removed so
 * `**shall**` reads as `shall`.
 */
function plain(text: string): string {
  return text
    .replace(/`[^`]*`/g, '')
    .replace(/_shall_/g, '')
    .replace(/\*\*|__|(?<!\w)_|_(?!\w)/g, '');
}

function backticked(text: string): string[] {
  return [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]!.trim());
}

/**
 * Whether the "Verified by" text names at least one mechanism that exists.
 * Returns the reason when it does not.
 */
export function checkVerifiedBy(
  verifiedBy: string,
  mechanisms: Mechanisms,
): string | null {
  if (verifiedBy.trim().length === 0) return 'has no "Verified by" line';

  const fileSet = new Set(mechanisms.files);
  const byBase = new Map<string, number>();
  for (const f of mechanisms.files) {
    const base = f.split('/').pop() ?? f;
    byBase.set(base, (byBase.get(base) ?? 0) + 1);
  }
  const dirs = new Set(
    mechanisms.files.flatMap((f) => {
      const parts = f.split('/');
      return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join('/'));
    }),
  );

  const tokens = backticked(verifiedBy);
  for (const token of tokens) {
    if (
      (EXTERNAL_MECHANISMS as readonly string[]).includes(token.toLowerCase())
    )
      return null;
    const script = /^npm run ([\w:.-]+)/.exec(token);
    if (script && mechanisms.scripts.has(script[1]!)) return null;
    if (mechanisms.scripts.has(token)) return null;
    if (mechanisms.jobs.has(token) || mechanisms.workflows.has(token))
      return null;
    const asPath = token.replace(/\/$/, '');
    if (fileSet.has(asPath) || dirs.has(asPath)) return null;
    if (!token.includes('/') && (byBase.get(token) ?? 0) > 0) return null;
  }
  // A job's display name is quoted, not backticked ("Mutation (changed files)").
  for (const quoted of [...verifiedBy.matchAll(/"([^"]+)"/g)].map(
    (m) => m[1]!,
  )) {
    if (mechanisms.jobs.has(quoted)) return null;
  }
  return tokens.length === 0
    ? 'names no script, job or file (nothing in backticks)'
    : `names nothing that exists: ${tokens.map((t) => `\`${t}\``).join(', ')}`;
}

/** Audit every block; an empty list means the charter passes. */
export function auditCharter(
  blocks: readonly CharterBlock[],
  mechanisms: Mechanisms,
): CharterFinding[] {
  const findings: CharterFinding[] = [];
  const seen = new Set<string>();
  const add = (b: CharterBlock, message: string) =>
    findings.push({ id: b.id || '(no id)', line: b.line, message });

  for (const b of blocks) {
    if (b.fields.length !== 3) {
      add(
        b,
        `header has ${b.fields.length} field(s); the form is \`ID · pattern · status\``,
      );
    }
    if (!/^[A-Z]+-\d{2}$/.test(b.id)) {
      add(b, `id '${b.id}' is not PREFIX-NN`);
    } else if (seen.has(b.id)) {
      add(b, `id '${b.id}' is used twice`);
    }
    seen.add(b.id);

    if (!(PATTERNS as readonly string[]).includes(b.pattern)) {
      add(b, `pattern '${b.pattern}' is not one of ${PATTERNS.join(', ')}`);
    }
    if (!(STATUSES as readonly string[]).includes(b.status)) {
      add(b, `status '${b.status}' is not one of ${STATUSES.join(', ')}`);
    }

    const text = plain(b.text);
    if (text.length === 0) {
      add(b, 'has no requirement paragraph under the header');
      continue;
    }
    const shall = countShall(text);
    if (shall !== 1) {
      add(
        b,
        `has ${shall} 'shall'; a requirement states exactly one obligation`,
      );
    }
    for (const word of findWrongObligationKeywords(text)) {
      add(b, `uses '${word}' where the obligation keyword is 'shall'`);
    }
    for (const [term, category] of findVagueTerms(text)) {
      add(b, `uses the ${category} '${term}', which cannot be verified`);
    }
    for (const problem of checkEarsPatternStructure(text)) add(b, problem);
    for (const problem of checkMissingSystemName(text)) add(b, problem);

    const later = countShall(plain(b.rest));
    if (later > 0) {
      add(
        b,
        `has ${later} 'shall' after its first paragraph; a block states one requirement, then its rationale`,
      );
    }

    const lead = leadingPattern(text);
    if (
      (PATTERNS as readonly string[]).includes(b.pattern) &&
      lead !== b.pattern
    ) {
      add(
        b,
        `is declared ${b.pattern} but its text reads as ${lead} (${lead === 'Ubiquitous' ? 'no leading keyword' : `it opens with '${text.split(/\s+/)[0]}'`})`,
      );
    }

    if (b.status === 'Enforced') {
      const reason = checkVerifiedBy(b.verifiedBy, mechanisms);
      if (reason) add(b, `is Enforced but its "Verified by" ${reason}`);
    }
  }
  return findings;
}

/** One line per finding, for the console and GitHub annotations. */
export function formatFindings(
  findings: readonly CharterFinding[],
  file: string,
): string[] {
  return findings.map((f) => `${file}:${f.line}: ${f.id} ${f.message}`);
}
